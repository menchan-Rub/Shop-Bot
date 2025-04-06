import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Divider,
  Flex,
  Heading,
  Icon,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Text,
  useColorModeValue,
  useToast,
  Badge,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  HStack,
  VStack,
  ButtonGroup,
  Tooltip,
  Spinner,
  Stat,
  StatLabel,
  StatNumber,
  StatGroup,
  SimpleGrid,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Container,
} from '@chakra-ui/react';
import { useRouter } from 'next/router';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminGuard from '@/components/admin/AdminGuard';
import axios from 'axios';
import { 
  FiSearch,
  FiRefreshCw,
  FiFilter,
  FiDownload,
  FiInfo,
  FiAlertTriangle,
  FiAlertCircle,
  FiKey,
  FiChevronLeft,
  FiChevronRight,
  FiEye,
  FiCalendar,
  FiUser,
  FiServer,
  FiActivity,
} from 'react-icons/fi';

interface LogItem {
  id: string;
  timestamp: string;
  type: 'info' | 'warning' | 'error' | 'auth';
  action: string;
  userId: string;
  userName: string;
  userEmail: string;
  ipAddress: string;
  status: 'success' | 'warning' | 'failed';
  details?: string;
}

interface LogSummary {
  total: number;
  info: number;
  warning: number;
  error: number;
  auth: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export default function AdminLogs() {
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [selectedLog, setSelectedLog] = useState<LogItem | null>(null);
  const [summary, setSummary] = useState<LogSummary>({
    total: 0,
    info: 0,
    warning: 0,
    error: 0,
    auth: 0,
  });
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [logType, setLogType] = useState('all');
  const router = useRouter();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  // カラーモード
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.600', 'gray.300');

  useEffect(() => {
    // 管理者権限チェック
    const checkAdminAccess = () => {
      // セッションの確認
      const isAdminBySession = session?.user?.isAdmin || session?.user?.role === 'admin';
      
      // ローカルストレージの確認
      const adminToken = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
      const hasAdminToken = !!adminToken && adminToken.length > 10;
      
      // いずれかの方法で管理者と確認できれば許可
      return isAdminBySession || hasAdminToken;
    };
    
    const isAdmin = checkAdminAccess();
    
    if (isAdmin) {
      fetchLogs();
    } else if (status === 'authenticated' && !isAdmin) {
      router.replace('/');
      toast({
        title: "アクセス権限がありません",
        description: "管理者ページにアクセスする権限がありません",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  }, [session, status]);

  // ログデータを取得
  const fetchLogs = async (refresh = false) => {
    if (refresh) {
      setPagination({ ...pagination, page: 1 });
    }

    setLoading(true);
    setError(null);
    
    try {
      // 管理者トークンを取得
      const adminToken = localStorage.getItem('adminToken');
      if (!adminToken) {
        throw new Error('管理者トークンがありません');
      }

      // ログデータを取得
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/logs`,
        {
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
          params: {
            page: pagination.page,
            limit: pagination.limit,
            type: logType,
            search: searchQuery,
          }
        }
      );

      setLogs(response.data.logs || []);
      setSummary(response.data.summary || {
        total: 0,
        info: 0,
        warning: 0,
        error: 0,
        auth: 0,
      });
      setPagination(response.data.pagination || {
        page: 1,
        limit: 50,
        total: 0,
        pages: 0,
      });
    } catch (err: any) {
      console.error('ログデータ取得エラー:', err);
      setError(err.response?.data?.message || 'ログデータの取得に失敗しました');
      
      // トークンエラーの場合はログインページにリダイレクト
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem('adminToken');
        router.push('/admin/login');
      }
    } finally {
      setLoading(false);
    }
  };

  // 前のページへ
  const goToPreviousPage = () => {
    if (pagination.page > 1) {
      setPagination({ ...pagination, page: pagination.page - 1 });
    }
  };

  // 次のページへ
  const goToNextPage = () => {
    if (pagination.page < pagination.pages) {
      setPagination({ ...pagination, page: pagination.page + 1 });
    }
  };

  // 検索実行
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLogs(true);
  };

  // ログの詳細表示
  const viewLogDetails = (log: LogItem) => {
    setSelectedLog(log);
    onOpen();
  };

  // ログCSVエクスポート
  const exportLogsAsCSV = () => {
    // CSVヘッダー
    const csvHeaders = ['ID', 'タイムスタンプ', 'タイプ', 'アクション', 'ユーザーID', 'ユーザー名', 'メールアドレス', 'IPアドレス', 'ステータス', '詳細'];
    
    // CSVデータ
    const csvContent = [
      csvHeaders.join(','),
      ...logs.map(log => [
        log.id,
        log.timestamp,
        log.type,
        `"${log.action.replace(/"/g, '""')}"`,
        log.userId,
        `"${log.userName.replace(/"/g, '""')}"`,
        log.userEmail,
        log.ipAddress,
        log.status,
        `"${(log.details || '').replace(/"/g, '""')}"`
      ].join(','))
    ].join('\n');
    
    // CSVファイルをダウンロード
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const filename = `system-logs-${timestamp}.csv`;
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: 'CSVエクスポート完了',
      description: `${logs.length}件のログデータをエクスポートしました`,
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  // 日付のフォーマット
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date);
  };

  // ログタイプに対応するアイコンとカラーを取得
  const getLogTypeProps = (type: string) => {
    switch (type) {
      case 'info':
        return { icon: FiInfo, color: 'blue' };
      case 'warning':
        return { icon: FiAlertTriangle, color: 'orange' };
      case 'error':
        return { icon: FiAlertCircle, color: 'red' };
      case 'auth':
        return { icon: FiKey, color: 'purple' };
      default:
        return { icon: FiInfo, color: 'gray' };
    }
  };

  // ログステータスに対応するバッジのカラーを取得
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'green';
      case 'warning':
        return 'orange';
      case 'failed':
        return 'red';
      default:
        return 'gray';
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <Container maxW="container.md" py={8}>
          <VStack spacing={6} align="center">
            <Spinner size="xl" color="cyan.500" thickness="4px" speed="0.65s" />
            <Text mt={4}>ログデータを読み込み中...</Text>
          </VStack>
        </Container>
      </AdminLayout>
    );
  }

  const adminToken = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
  const hasAdminPermission = session?.user?.isAdmin || adminToken;

  if (!hasAdminPermission) {
    return (
      <Container maxW="container.md" py={8}>
        <VStack spacing={6} align="center">
          <Heading>アクセス権限がありません</Heading>
          <Text>このページにアクセスするには管理者権限が必要です</Text>
          <Button 
            colorScheme="cyan"
            onClick={() => window.location.href = '/'}
          >
            トップページへ戻る
          </Button>
        </VStack>
      </Container>
    );
  }

  return (
    <AdminGuard>
      <AdminLayout>
        <Box p={4}>
          <Flex justifyContent="space-between" alignItems="center" mb={6}>
            <Box>
              <Heading size="lg">システムログ</Heading>
              <Text color={textColor} mt={1}>
                システムアクティビティのログと監査記録
              </Text>
            </Box>
            <Button
              size="sm"
              onClick={() => fetchLogs(true)}
              isLoading={loading}
              colorScheme="teal"
              leftIcon={<Icon as={FiRefreshCw} />}
            >
              ログを更新
            </Button>
          </Flex>

          {error && (
            <Alert status="error" mb={6} borderRadius="md">
              <AlertIcon />
              <AlertTitle mr={2}>エラーが発生しました</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* ログサマリー統計 */}
          <SimpleGrid columns={{ base: 1, md: 5 }} spacing={4} mb={6}>
            <Stat bg={bgColor} p={3} borderRadius="md" borderWidth="1px" borderColor={borderColor}>
              <StatLabel>総ログ数</StatLabel>
              <StatNumber>{summary.total.toLocaleString()}</StatNumber>
            </Stat>
            <Stat bg={bgColor} p={3} borderRadius="md" borderWidth="1px" borderColor={borderColor}>
              <StatLabel color="blue.500"><Icon as={FiInfo} mr={2} />情報</StatLabel>
              <StatNumber>{summary.info.toLocaleString()}</StatNumber>
            </Stat>
            <Stat bg={bgColor} p={3} borderRadius="md" borderWidth="1px" borderColor={borderColor}>
              <StatLabel color="orange.500"><Icon as={FiAlertTriangle} mr={2} />警告</StatLabel>
              <StatNumber>{summary.warning.toLocaleString()}</StatNumber>
            </Stat>
            <Stat bg={bgColor} p={3} borderRadius="md" borderWidth="1px" borderColor={borderColor}>
              <StatLabel color="red.500"><Icon as={FiAlertCircle} mr={2} />エラー</StatLabel>
              <StatNumber>{summary.error.toLocaleString()}</StatNumber>
            </Stat>
            <Stat bg={bgColor} p={3} borderRadius="md" borderWidth="1px" borderColor={borderColor}>
              <StatLabel color="purple.500"><Icon as={FiKey} mr={2} />認証</StatLabel>
              <StatNumber>{summary.auth.toLocaleString()}</StatNumber>
            </Stat>
          </SimpleGrid>

          {/* 検索・フィルターバー */}
          <Card variant="outline" borderColor={borderColor} mb={6}>
            <CardBody>
              <Flex 
                direction={{ base: 'column', md: 'row' }} 
                alignItems={{ base: 'flex-start', md: 'center' }}
                justifyContent="space-between"
                gap={4}
              >
                <form onSubmit={handleSearch} style={{ width: '100%', maxWidth: '400px' }}>
                  <InputGroup>
                    <InputLeftElement pointerEvents="none">
                      <Icon as={FiSearch} color="gray.500" />
                    </InputLeftElement>
                    <Input
                      placeholder="ログを検索..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </InputGroup>
                </form>
                
                <HStack spacing={2}>
                  <Flex alignItems="center">
                    <Icon as={FiFilter} color="gray.500" mr={2} />
                    <Select
                      value={logType}
                      onChange={(e) => setLogType(e.target.value)}
                      size="md"
                      width="auto"
                    >
                      <option value="all">すべてのログ</option>
                      <option value="info">情報</option>
                      <option value="warning">警告</option>
                      <option value="error">エラー</option>
                      <option value="auth">認証</option>
                    </Select>
                  </Flex>
                  
                  <Button
                    leftIcon={<Icon as={FiDownload} />}
                    colorScheme="blue"
                    variant="outline"
                    size="md"
                    onClick={exportLogsAsCSV}
                    isDisabled={logs.length === 0}
                  >
                    CSV出力
                  </Button>
                </HStack>
              </Flex>
            </CardBody>
          </Card>

          {/* ログテーブル */}
          <Card variant="outline" borderColor={borderColor}>
            <CardHeader pb={2}>
              <Heading size="md">ログ記録</Heading>
            </CardHeader>
            <Divider />
            <CardBody p={0}>
              {loading ? (
                <Flex justify="center" p={6}>
                  <Spinner />
                </Flex>
              ) : logs.length > 0 ? (
                <Box overflowX="auto">
                  <Table variant="simple">
                    <Thead>
                      <Tr>
                        <Th>タイムスタンプ</Th>
                        <Th>タイプ</Th>
                        <Th>アクション</Th>
                        <Th>ユーザー</Th>
                        <Th>ステータス</Th>
                        <Th>操作</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {logs.map((log) => {
                        const typeProps = getLogTypeProps(log.type);
                        
                        return (
                          <Tr key={log.id}>
                            <Td>
                              <HStack>
                                <Icon as={FiCalendar} color="gray.500" />
                                <Text>{formatDate(log.timestamp)}</Text>
                              </HStack>
                            </Td>
                            <Td>
                              <Badge
                                colorScheme={typeProps.color}
                                display="flex"
                                alignItems="center"
                                width="fit-content"
                                px={2}
                                py={1}
                              >
                                <Icon as={typeProps.icon} mr={1} />
                                <Text textTransform="capitalize">{log.type}</Text>
                              </Badge>
                            </Td>
                            <Td>
                              <Tooltip label={log.details} isDisabled={!log.details}>
                                <Text maxW="200px" isTruncated>
                                  {log.action}
                                </Text>
                              </Tooltip>
                            </Td>
                            <Td>
                              <HStack>
                                <Icon as={FiUser} color="gray.500" />
                                <Text maxW="150px" isTruncated>
                                  {log.userName}
                                </Text>
                              </HStack>
                            </Td>
                            <Td>
                              <Badge colorScheme={getStatusColor(log.status)}>
                                {log.status}
                              </Badge>
                            </Td>
                            <Td>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => viewLogDetails(log)}
                                leftIcon={<Icon as={FiEye} />}
                              >
                                詳細
                              </Button>
                            </Td>
                          </Tr>
                        );
                      })}
                    </Tbody>
                  </Table>
                </Box>
              ) : (
                <Text textAlign="center" py={6} color={textColor}>
                  ログデータがありません
                </Text>
              )}
              
              {/* ページネーション */}
              {pagination.pages > 1 && (
                <Flex justify="space-between" align="center" p={4} borderTopWidth="1px" borderColor={borderColor}>
                  <Text color={textColor}>
                    {pagination.total} 件中 {(pagination.page - 1) * pagination.limit + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} 件を表示
                  </Text>
                  <HStack>
                    <Button
                      size="sm"
                      onClick={goToPreviousPage}
                      isDisabled={pagination.page <= 1}
                      leftIcon={<Icon as={FiChevronLeft} />}
                    >
                      前へ
                    </Button>
                    <Text>
                      {pagination.page} / {pagination.pages}
                    </Text>
                    <Button
                      size="sm"
                      onClick={goToNextPage}
                      isDisabled={pagination.page >= pagination.pages}
                      rightIcon={<Icon as={FiChevronRight} />}
                    >
                      次へ
                    </Button>
                  </HStack>
                </Flex>
              )}
            </CardBody>
          </Card>
        </Box>

        {/* ログ詳細モーダル */}
        <Modal isOpen={isOpen} onClose={onClose} size="lg">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>ログ詳細</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              {selectedLog && (
                <VStack align="stretch" spacing={4}>
                  <Box>
                    <Text fontWeight="bold">ログID:</Text>
                    <Text>{selectedLog.id}</Text>
                  </Box>
                  <Box>
                    <Text fontWeight="bold">タイムスタンプ:</Text>
                    <Text>{formatDate(selectedLog.timestamp)}</Text>
                  </Box>
                  <Box>
                    <Text fontWeight="bold">タイプ:</Text>
                    <Badge colorScheme={getLogTypeProps(selectedLog.type).color}>
                      {selectedLog.type}
                    </Badge>
                  </Box>
                  <Box>
                    <Text fontWeight="bold">アクション:</Text>
                    <Text>{selectedLog.action}</Text>
                  </Box>
                  <Box>
                    <Text fontWeight="bold">ユーザー情報:</Text>
                    <Text>ID: {selectedLog.userId}</Text>
                    <Text>名前: {selectedLog.userName}</Text>
                    <Text>メール: {selectedLog.userEmail}</Text>
                  </Box>
                  <Box>
                    <Text fontWeight="bold">IPアドレス:</Text>
                    <Text>{selectedLog.ipAddress}</Text>
                  </Box>
                  <Box>
                    <Text fontWeight="bold">ステータス:</Text>
                    <Badge colorScheme={getStatusColor(selectedLog.status)}>
                      {selectedLog.status}
                    </Badge>
                  </Box>
                  {selectedLog.details && (
                    <Box>
                      <Text fontWeight="bold">詳細情報:</Text>
                      <Text>{selectedLog.details}</Text>
                    </Box>
                  )}
                </VStack>
              )}
            </ModalBody>
            <ModalFooter>
              <Button colorScheme="blue" mr={3} onClick={onClose}>
                閉じる
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </AdminLayout>
    </AdminGuard>
  );
} 