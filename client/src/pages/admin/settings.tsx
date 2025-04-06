import { useEffect, useState } from 'react';
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
  List,
  ListItem,
  SimpleGrid,
  Spinner,
  Stack,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Tag,
  Text,
  useColorModeValue,
  useToast,
  Badge,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Code,
  VStack,
  HStack,
  Container,
} from '@chakra-ui/react';
import { useRouter } from 'next/router';
import AdminLayout from '../../components/admin/AdminLayout';
import AdminGuard from '../../components/admin/AdminGuard';
import axios from 'axios';
import { FiAlertCircle, FiCheck, FiSettings, FiX, FiKey, FiServer, FiInfo } from 'react-icons/fi';
import { useSession } from 'next-auth/react';

interface EnvVarCheck {
  key: string;
  set: boolean;
  value: string | null;
}

interface EnvStatus {
  required: EnvVarCheck[];
  discordAdminCount: number;
  jwtSecret: boolean;
  allRequiredSet: boolean;
}

interface EnvCheckResponse {
  status: 'ok' | 'missing';
  env: EnvStatus;
  warnings: string[];
}

export default function AdminSettings() {
  const [envStatus, setEnvStatus] = useState<EnvStatus | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const toast = useToast();
  const session = useSession();
  const status = session?.status;

  // カラーモード
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const successColor = useColorModeValue('green.500', 'green.300');
  const errorColor = useColorModeValue('red.500', 'red.300');
  const warningColor = useColorModeValue('orange.500', 'orange.300');

  // エラー解決: fetchSettings関数の定義
  const fetchSettings = async () => {
    await checkEnvVariables();
    // 必要に応じて追加の設定読み込み処理
  };

  useEffect(() => {
    // 管理者権限チェック
    const checkAdminAccess = () => {
      // セッションの確認
      const isAdminBySession = session?.user?.isAdmin || session?.user?.role === 'admin';
      
      // ローカルストレージの確認
      const adminToken = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
      const hasAdminToken = !!adminToken && adminToken.length > 10;
      
      console.log('設定ページ - 権限チェック:', { isAdminBySession, hasAdminToken, adminToken });
      
      // いずれかの方法で管理者と確認できれば許可
      return isAdminBySession || hasAdminToken;
    };
    
    const isAdmin = checkAdminAccess();
    
    if (isAdmin) {
      fetchSettings();
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

  useEffect(() => {
    checkEnvVariables();
  }, []);

  // 環境変数のチェック
  const checkEnvVariables = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // 管理者トークンを取得
      const adminToken = localStorage.getItem('adminToken');
      if (!adminToken) {
        throw new Error('管理者トークンがありません');
      }

      // 環境変数確認APIを呼び出し
      const response = await axios.get<EnvCheckResponse>(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/check-env`,
        {
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        }
      );

      setEnvStatus(response.data.env);
      setWarnings(response.data.warnings);
    } catch (err: any) {
      console.error('環境変数確認エラー:', err);
      setError(err.response?.data?.message || 'データの取得に失敗しました');
      
      // トークンエラーの場合はログインページにリダイレクト
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem('adminToken');
        router.push('/admin/login');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container maxW="container.md" py={8}>
        <VStack spacing={6} align="center">
          <Spinner size="xl" color="cyan.500" thickness="4px" speed="0.65s" />
          <Text mt={4}>設定データを読み込み中...</Text>
        </VStack>
      </Container>
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
              <Heading size="lg">管理者設定</Heading>
              <Text color={textColor} mt={1}>
                システム設定とステータス確認
              </Text>
            </Box>
            <Button
              size="sm"
              onClick={checkEnvVariables}
              isLoading={loading}
              colorScheme="teal"
              leftIcon={<Icon as={FiSettings} />}
            >
              設定を更新
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
              <Tab>システム状態</Tab>
              <Tab>環境変数</Tab>
              <Tab>セキュリティ</Tab>
            </TabList>

            <TabPanels>
              {/* システム状態タブ */}
              <TabPanel>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                  <Card variant="outline" borderColor={borderColor}>
                    <CardHeader>
                      <Heading size="md">システム状態</Heading>
                    </CardHeader>
                    <Divider />
                    <CardBody>
                      {loading ? (
                        <Flex justify="center" p={6}>
                          <Spinner />
                        </Flex>
                      ) : (
                        <List spacing={3}>
                          <ListItem>
                            <Flex justify="space-between" align="center">
                              <HStack>
                                <Icon as={FiServer} color="blue.500" />
                                <Text>API接続状態</Text>
                              </HStack>
                              <Badge colorScheme="green">正常</Badge>
                            </Flex>
                          </ListItem>
                          <ListItem>
                            <Flex justify="space-between" align="center">
                              <HStack>
                                <Icon as={FiKey} color="purple.500" />
                                <Text>認証システム</Text>
                              </HStack>
                              <Badge colorScheme="green">正常</Badge>
                            </Flex>
                          </ListItem>
                          <ListItem>
                            <Flex justify="space-between" align="center">
                              <HStack>
                                <Icon as={FiSettings} color="orange.500" />
                                <Text>環境変数</Text>
                              </HStack>
                              {envStatus?.allRequiredSet ? (
                                <Badge colorScheme="green">正常</Badge>
                              ) : (
                                <Badge colorScheme="red">設定不足</Badge>
                              )}
                            </Flex>
                          </ListItem>
                        </List>
                      )}
                    </CardBody>
                  </Card>

                  <Card variant="outline" borderColor={borderColor}>
                    <CardHeader>
                      <Heading size="md">警告メッセージ</Heading>
                    </CardHeader>
                    <Divider />
                    <CardBody>
                      {loading ? (
                        <Flex justify="center" p={6}>
                          <Spinner />
                        </Flex>
                      ) : warnings.length > 0 ? (
                        <VStack spacing={3} align="stretch">
                          {warnings.map((warning, index) => (
                            <Alert key={index} status="warning" borderRadius="md">
                              <AlertIcon />
                              <Text>{warning}</Text>
                            </Alert>
                          ))}
                        </VStack>
                      ) : (
                        <Flex 
                          direction="column" 
                          align="center" 
                          justify="center" 
                          p={6} 
                          color="green.500"
                        >
                          <Icon as={FiCheck} boxSize={10} mb={3} />
                          <Text fontWeight="bold">警告はありません</Text>
                        </Flex>
                      )}
                    </CardBody>
                  </Card>
                </SimpleGrid>
              </TabPanel>

              {/* 環境変数タブ */}
              <TabPanel>
                <Card variant="outline" borderColor={borderColor}>
                  <CardHeader>
                    <Heading size="md">環境変数設定状態</Heading>
                  </CardHeader>
                  <Divider />
                  <CardBody>
                    {loading ? (
                      <Flex justify="center" p={6}>
                        <Spinner />
                      </Flex>
                    ) : (
                      <>
                        <Alert 
                          status={envStatus?.allRequiredSet ? "success" : "error"} 
                          mb={4}
                        >
                          <AlertIcon />
                          {envStatus?.allRequiredSet 
                            ? "すべての必須環境変数が設定されています" 
                            : "一部の必須環境変数が設定されていません"}
                        </Alert>
                        
                        <Text mb={4} fontWeight="bold">必須環境変数：</Text>
                        <List spacing={3} mb={8}>
                          {envStatus?.required.map((env) => (
                            <ListItem key={env.key}>
                              <Flex justify="space-between" align="center">
                                <HStack>
                                  <Icon 
                                    as={env.set ? FiCheck : FiX} 
                                    color={env.set ? successColor : errorColor} 
                                  />
                                  <Code>{env.key}</Code>
                                </HStack>
                                {env.set ? (
                                  <Tag colorScheme="green" size="sm">
                                    {env.value || "設定済み"}
                                  </Tag>
                                ) : (
                                  <Tag colorScheme="red" size="sm">未設定</Tag>
                                )}
                              </Flex>
                            </ListItem>
                          ))}
                        </List>

                        <Box mt={6} p={4} bg="gray.50" _dark={{ bg: "gray.700" }} borderRadius="md">
                          <Heading size="sm" mb={3}>環境変数の設定方法：</Heading>
                          <Text fontSize="sm" mb={3}>
                            プロジェクトのルートディレクトリに <Code>.env.local</Code> ファイルを作成し、以下のように設定してください：
                          </Text>
                          <Code p={3} display="block" whiteSpace="pre" overflowX="auto" borderRadius="md">
                            {`# 必須環境変数
ADMIN_DISCORD_IDS=123456789012345678,234567890123456789
JWT_SECRET=your_secure_jwt_secret
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_secure_nextauth_secret
DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_CLIENT_SECRET=your_discord_client_secret`}
                          </Code>
                        </Box>
                      </>
                    )}
                  </CardBody>
                </Card>
              </TabPanel>

              {/* セキュリティタブ */}
              <TabPanel>
                <Card variant="outline" borderColor={borderColor}>
                  <CardHeader>
                    <Heading size="md">セキュリティ設定</Heading>
                  </CardHeader>
                  <Divider />
                  <CardBody>
                    <Stack spacing={6}>
                      <Box>
                        <Heading size="sm" mb={2}>管理者アクセス</Heading>
                        <HStack spacing={4}>
                          <Text>登録済み管理者：</Text>
                          <Tag colorScheme={envStatus?.discordAdminCount ? "green" : "red"}>
                            {envStatus?.discordAdminCount || 0} 人
                          </Tag>
                        </HStack>
                        <Text fontSize="sm" color={textColor} mt={1}>
                          {envStatus?.discordAdminCount 
                            ? `${envStatus.discordAdminCount}人の管理者がDiscord IDで登録されています` 
                            : "管理者が登録されていません。ADMIN_DISCORD_IDS環境変数を設定してください"}
                        </Text>
                      </Box>

                      <Box>
                        <Heading size="sm" mb={2}>JWT設定</Heading>
                        <HStack spacing={4}>
                          <Text>JWTシークレット：</Text>
                          <Tag colorScheme={envStatus?.jwtSecret ? "green" : "orange"}>
                            {envStatus?.jwtSecret ? "カスタム設定" : "デフォルト値"}
                          </Tag>
                        </HStack>
                        {!envStatus?.jwtSecret && (
                          <Alert status="warning" mt={2} size="sm">
                            <AlertIcon />
                            <Text fontSize="sm">
                              JWTシークレットがデフォルト値のままです。本番環境ではカスタム値に変更してください。
                            </Text>
                          </Alert>
                        )}
                      </Box>

                      <Box>
                        <Heading size="sm" mb={2}>セキュリティガイド</Heading>
                        <List spacing={2}>
                          <ListItem>
                            <HStack>
                              <Icon as={FiInfo} color={warningColor} />
                              <Text fontSize="sm">
                                本番環境では、すべてのシークレットキーに強力でユニークな値を使用してください。
                              </Text>
                            </HStack>
                          </ListItem>
                          <ListItem>
                            <HStack>
                              <Icon as={FiInfo} color={warningColor} />
                              <Text fontSize="sm">
                                管理者アクセスは必要最小限の人数に制限してください。
                              </Text>
                            </HStack>
                          </ListItem>
                          <ListItem>
                            <HStack>
                              <Icon as={FiInfo} color={warningColor} />
                              <Text fontSize="sm">
                                環境変数ファイル（.env）はGitリポジトリにコミットしないでください。
                              </Text>
                            </HStack>
                          </ListItem>
                        </List>
                      </Box>
                    </Stack>
                  </CardBody>
                </Card>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </Box>
      </AdminLayout>
    </AdminGuard>
  );
} 