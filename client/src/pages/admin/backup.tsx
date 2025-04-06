import { useState, useEffect, useRef } from 'react';
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
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Switch,
  VStack,
  HStack,
  Spinner,
  Link,
  Container,
} from '@chakra-ui/react';
import { useRouter } from 'next/router';
import AdminLayout from '../../components/admin/AdminLayout';
import AdminGuard from '@/components/admin/AdminGuard';
import axios from 'axios';
import { 
  FiDatabase, 
  FiDownload, 
  FiUpload, 
  FiRefreshCw, 
  FiClock,
  FiFile,
  FiUser,
  FiAlertTriangle,
} from 'react-icons/fi';
import { useSession } from 'next-auth/react';

interface BackupMeta {
  timestamp: string;
  version: string;
  generatedBy: string;
  discordId: string;
}

interface BackupHistoryItem {
  filename: string;
  createdAt: string;
  size: number;
  meta: BackupMeta;
}

export default function AdminBackup() {
  const [backupHistory, setBackupHistory] = useState<BackupHistoryItem[]>([]);
  const [backupData, setBackupData] = useState<any>(null);
  const [backupJson, setBackupJson] = useState<string>('');
  const [selectedBackup, setSelectedBackup] = useState<BackupHistoryItem | null>(null);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [isRestoringBackup, setIsRestoringBackup] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isOpen, onOpen: openModal, onClose: closeModal } = useDisclosure();
  const session = useSession();
  const status = session?.status;
  const loading = session?.status === 'loading';

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
      fetchBackupHistory();
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

  // バックアップ履歴の取得
  const fetchBackupHistory = async () => {
    setIsLoadingHistory(true);
    setError(null);
    
    try {
      // 管理者トークンを取得
      const adminToken = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
      if (!adminToken) {
        throw new Error('管理者トークンがありません');
      }

      // バックアップ履歴を取得
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/backup-history`,
        {
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        }
      );

      setBackupHistory(response.data.backups || []);
    } catch (err: any) {
      console.error('バックアップ履歴取得エラー:', err);
      setError(err.response?.data?.message || 'バックアップ履歴の取得に失敗しました');
      
      // トークンエラーの場合はログインページにリダイレクト
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem('adminToken');
        router.push('/admin/login');
      }
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // バックアップの作成
  const createBackup = async () => {
    setIsCreatingBackup(true);
    setError(null);
    
    try {
      // 管理者トークンを取得
      const adminToken = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
      if (!adminToken) {
        throw new Error('管理者トークンがありません');
      }

      // バックアップを作成
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/backup`,
        {
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        }
      );

      // バックアップデータを保存
      setBackupData(response.data.backup);
      setBackupJson(JSON.stringify(response.data.backup, null, 2));
      
      toast({
        title: 'バックアップ作成成功',
        description: 'バックアップデータが正常に作成されました',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      // バックアップ履歴を更新
      fetchBackupHistory();
    } catch (err: any) {
      console.error('バックアップ作成エラー:', err);
      setError(err.response?.data?.message || 'バックアップの作成に失敗しました');
      
      toast({
        title: 'バックアップ作成エラー',
        description: err.response?.data?.message || 'バックアップの作成に失敗しました',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsCreatingBackup(false);
    }
  };

  // バックアップのダウンロード
  const downloadBackup = () => {
    if (!backupData) return;
    
    const dataStr = JSON.stringify(backupData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const filename = `shop-backup-${timestamp}.json`;
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: 'ダウンロード開始',
      description: `バックアップファイル "${filename}" のダウンロードを開始しました`,
      status: 'info',
      duration: 3000,
      isClosable: true,
    });
  };

  // バックアップファイルの選択
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);
        
        // バックアップデータの検証
        if (!data.data || !data.meta) {
          throw new Error('バックアップファイルの形式が正しくありません');
        }
        
        setBackupData(data);
        setBackupJson(JSON.stringify(data, null, 2));
        
        toast({
          title: 'バックアップファイル読み込み成功',
          description: `${file.name} を正常に読み込みました`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } catch (error) {
        console.error('バックアップファイル読み込みエラー:', error);
        toast({
          title: 'バックアップファイル読み込みエラー',
          description: '無効なJSONファイルです',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    };
    
    reader.readAsText(file);
  };

  // バックアップの復元
  const restoreBackup = async () => {
    if (!backupData) {
      toast({
        title: '復元できません',
        description: 'バックアップデータがありません',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    setIsRestoringBackup(true);
    setError(null);
    
    try {
      // 管理者トークンを取得
      const adminToken = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
      if (!adminToken) {
        throw new Error('管理者トークンがありません');
      }

      // バックアップを復元
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/backup`,
        { backup: backupData },
        {
          headers: {
            Authorization: `Bearer ${adminToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      toast({
        title: 'バックアップ復元成功',
        description: '複元処理が完了しました',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      // バックアップ履歴を更新
      fetchBackupHistory();
      
      // モーダルを閉じる
      closeModal();
    } catch (err: any) {
      console.error('バックアップ復元エラー:', err);
      setError(err.response?.data?.message || 'バックアップの復元に失敗しました');
      
      toast({
        title: 'バックアップ復元エラー',
        description: err.response?.data?.message || 'バックアップの復元に失敗しました',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsRestoringBackup(false);
    }
  };

  // バックアップ詳細を表示
  const viewBackupDetails = (backup: BackupHistoryItem) => {
    setSelectedBackup(backup);
    openModal();
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

  // ファイルサイズのフォーマット
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (loading) {
    return (
      <AdminLayout>
        <Container maxW="container.md" py={8}>
          <VStack spacing={6} align="center">
            <Spinner size="xl" color="cyan.500" thickness="4px" speed="0.65s" />
            <Text mt={4}>バックアップデータを読み込み中...</Text>
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
              <Heading size="lg">バックアップと復元</Heading>
              <Text color={textColor} mt={1}>
                システムデータのバックアップと復元
              </Text>
            </Box>
            <Button
              size="sm"
              onClick={fetchBackupHistory}
              isLoading={isLoadingHistory}
              colorScheme="teal"
              leftIcon={<Icon as={FiRefreshCw} />}
            >
              履歴を更新
            </Button>
          </Flex>

          {error && (
            <Alert status="error" mb={6} borderRadius="md">
              <AlertIcon />
              <AlertTitle mr={2}>エラーが発生しました</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Tabs variant="enclosed" colorScheme="teal">
            <TabList>
              <Tab>バックアップ作成</Tab>
              <Tab>バックアップ復元</Tab>
              <Tab>バックアップ履歴</Tab>
            </TabList>

            <TabPanels>
              {/* バックアップ作成タブ */}
              <TabPanel>
                <Card variant="outline" borderColor={borderColor} mb={6}>
                  <CardHeader>
                    <Heading size="md">バックアップの作成</Heading>
                  </CardHeader>
                  <Divider />
                  <CardBody>
                    <Text mb={4}>
                      現在のシステムデータのバックアップを作成します。バックアップには、ユーザー、注文、商品などのデータが含まれます。
                    </Text>
                    <Button
                      colorScheme="blue"
                      leftIcon={<Icon as={FiDatabase} />}
                      onClick={createBackup}
                      isLoading={isCreatingBackup}
                      loadingText="バックアップ作成中..."
                      mb={6}
                    >
                      バックアップを作成
                    </Button>

                    {backupData && (
                      <Box mt={4}>
                        <Alert status="success" mb={4}>
                          <AlertIcon />
                          <Box>
                            <AlertTitle>バックアップ作成完了</AlertTitle>
                            <AlertDescription>
                              バックアップデータを作成しました。ダウンロードして保存できます。
                            </AlertDescription>
                          </Box>
                        </Alert>
                        
                        <Button
                          colorScheme="green"
                          leftIcon={<Icon as={FiDownload} />}
                          onClick={downloadBackup}
                          mb={4}
                        >
                          バックアップをダウンロード
                        </Button>
                        
                        <Box
                          maxH="400px"
                          overflowY="auto"
                          p={3}
                          borderWidth="1px"
                          borderRadius="md"
                          fontFamily="monospace"
                          fontSize="sm"
                          bg="gray.50"
                          _dark={{ bg: "gray.900" }}
                        >
                          <pre>{backupJson}</pre>
                        </Box>
                      </Box>
                    )}
                  </CardBody>
                </Card>
              </TabPanel>

              {/* バックアップ復元タブ */}
              <TabPanel>
                <Card variant="outline" borderColor={borderColor} mb={6}>
                  <CardHeader>
                    <Heading size="md">バックアップの復元</Heading>
                  </CardHeader>
                  <Divider />
                  <CardBody>
                    <Alert status="warning" mb={4}>
                      <AlertIcon />
                      <Box>
                        <AlertTitle>注意</AlertTitle>
                        <AlertDescription>
                          バックアップを復元すると、現在のデータが上書きされます。この操作は元に戻せません。
                        </AlertDescription>
                      </Box>
                    </Alert>
                    
                    <FormControl mb={6}>
                      <FormLabel>バックアップファイルをアップロード</FormLabel>
                      <Input
                        type="file"
                        accept=".json"
                        onChange={handleFileSelect}
                        ref={fileInputRef}
                        h="auto"
                        py={1}
                      />
                    </FormControl>
                    
                    {backupData && (
                      <Box mt={4}>
                        <Alert status="info" mb={4}>
                          <AlertIcon />
                          <Box>
                            <AlertTitle>バックアップファイル読み込み完了</AlertTitle>
                            <AlertDescription>
                              復元の準備ができました。「バックアップを復元」ボタンをクリックして処理を開始してください。
                            </AlertDescription>
                          </Box>
                        </Alert>
                        
                        <Box mb={4}>
                          <Text fontWeight="bold">バックアップ情報：</Text>
                          {backupData.meta && (
                            <VStack align="start" spacing={1} mt={2}>
                              <Text fontSize="sm">作成日時: {backupData.meta.timestamp}</Text>
                              <Text fontSize="sm">作成者: {backupData.meta.generatedBy}</Text>
                              <Text fontSize="sm">バージョン: {backupData.meta.version}</Text>
                            </VStack>
                          )}
                        </Box>
                        
                        <Button
                          colorScheme="red"
                          leftIcon={<Icon as={FiAlertTriangle} />}
                          onClick={restoreBackup}
                          isLoading={isRestoringBackup}
                          loadingText="復元中..."
                        >
                          バックアップを復元
                        </Button>
                      </Box>
                    )}
                  </CardBody>
                </Card>
              </TabPanel>

              {/* バックアップ履歴タブ */}
              <TabPanel>
                <Card variant="outline" borderColor={borderColor}>
                  <CardHeader>
                    <Heading size="md">バックアップ履歴</Heading>
                  </CardHeader>
                  <Divider />
                  <CardBody>
                    {isLoadingHistory ? (
                      <Flex justify="center" p={6}>
                        <Spinner />
                      </Flex>
                    ) : backupHistory.length > 0 ? (
                      <Box overflowX="auto">
                        <Table variant="simple">
                          <Thead>
                            <Tr>
                              <Th>ファイル名</Th>
                              <Th>作成日時</Th>
                              <Th>サイズ</Th>
                              <Th>作成者</Th>
                              <Th>アクション</Th>
                            </Tr>
                          </Thead>
                          <Tbody>
                            {backupHistory.map((backup) => (
                              <Tr key={backup.filename}>
                                <Td>
                                  <HStack>
                                    <Icon as={FiFile} color="blue.500" />
                                    <Text>{backup.filename}</Text>
                                  </HStack>
                                </Td>
                                <Td>{formatDate(backup.createdAt)}</Td>
                                <Td>{formatFileSize(backup.size)}</Td>
                                <Td>
                                  <HStack>
                                    <Icon as={FiUser} size="sm" />
                                    <Text>{backup.meta.generatedBy}</Text>
                                  </HStack>
                                </Td>
                                <Td>
                                  <Button
                                    size="sm"
                                    colorScheme="blue"
                                    variant="outline"
                                    onClick={() => viewBackupDetails(backup)}
                                  >
                                    詳細
                                  </Button>
                                </Td>
                              </Tr>
                            ))}
                          </Tbody>
                        </Table>
                      </Box>
                    ) : (
                      <Text textAlign="center" py={4} color={textColor}>
                        バックアップ履歴はありません
                      </Text>
                    )}
                  </CardBody>
                </Card>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </Box>

        {/* バックアップ詳細モーダル */}
        <Modal isOpen={isOpen} onClose={closeModal} size="lg">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>バックアップ詳細</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              {selectedBackup && (
                <VStack align="stretch" spacing={4}>
                  <Box>
                    <Text fontWeight="bold">ファイル名:</Text>
                    <Text>{selectedBackup.filename}</Text>
                  </Box>
                  <Box>
                    <Text fontWeight="bold">作成日時:</Text>
                    <Text>{formatDate(selectedBackup.createdAt)}</Text>
                  </Box>
                  <Box>
                    <Text fontWeight="bold">サイズ:</Text>
                    <Text>{formatFileSize(selectedBackup.size)}</Text>
                  </Box>
                  <Box>
                    <Text fontWeight="bold">作成者:</Text>
                    <Text>{selectedBackup.meta.generatedBy}</Text>
                  </Box>
                  <Box>
                    <Text fontWeight="bold">Discord ID:</Text>
                    <Text>{selectedBackup.meta.discordId}</Text>
                  </Box>
                  <Box>
                    <Text fontWeight="bold">バージョン:</Text>
                    <Text>{selectedBackup.meta.version}</Text>
                  </Box>
                </VStack>
              )}
            </ModalBody>
            <ModalFooter>
              <Button colorScheme="blue" mr={3} onClick={closeModal}>
                閉じる
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </AdminLayout>
    </AdminGuard>
  );
} 