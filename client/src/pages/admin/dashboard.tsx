import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Flex,
  Heading,
  Text,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  SimpleGrid,
  VStack,
  HStack,
  Button,
  useColorModeValue,
  Spinner,
  Alert,
  AlertIcon,
  Icon,
  Divider,
  Card,
  CardBody,
  Stack,
  StatArrow,
  StatGroup,
  useToast,
  Center
} from '@chakra-ui/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import axios from 'axios';
import { FaUsers, FaShoppingCart, FaYenSign, FaChartLine, FaBox, FaMoneyBillWave } from 'react-icons/fa';
import AdminLayout from '../../components/admin/AdminLayout';
import { AdminGuard } from '../../components/admin/AdminGuard';
import { FiUsers, FiShoppingBag } from 'react-icons/fi';

interface DashboardStats {
  todayOrders: number;
  todayRevenue: number;
  yesterdayOrders: number;
  yesterdayRevenue: number;
  totalUsers: number;
  totalProducts: number;
  totalOrders: number;
  pendingOrders: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const toast = useToast();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hasAdminAccess, setHasAdminAccess] = useState(false);
  const [session, setSession] = useState(null);
  
  const statBgColor = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  // ダッシュボードの統計データを取得
  const fetchStats = async () => {
    try {
      setLoading(true);
      
      // ローカルストレージから管理者トークンを取得
      const adminToken = localStorage.getItem('adminToken');
      
      if (!adminToken) {
        router.push('/admin/login?error=unauthorized');
        return;
      }

      try {
        // クライアントサイドのAPIルートを使用する
        const response = await axios.get('/api/admin/dashboard-stats', {
          headers: {
            Authorization: `Bearer ${adminToken}`
          }
        });

        // 成功したらデータを設定
        setStats(response.data);
      } catch (apiError) {
        console.error('ダッシュボード統計の取得に失敗:', apiError);
        
        // エラー時はダミーデータを表示（開発環境用）
        toast({
          title: "統計データのロード中にエラーが発生しました",
          description: "デモデータを表示しています",
          status: "warning",
          duration: 5000,
          isClosable: true,
        });
        
        setStats({
          todayOrders: 12,
          todayRevenue: 158000,
          yesterdayOrders: 8,
          yesterdayRevenue: 95000,
          totalUsers: 254,
          totalProducts: 89,
          totalOrders: 423,
          pendingOrders: 7
        });
      }
    } catch (error) {
      console.error('ダッシュボード統計の取得に失敗:', error);
      setError('統計データの取得に失敗しました。後でもう一度お試しください。');
    } finally {
      setLoading(false);
    }
  };

  // 権限チェックロジック追加
  useEffect(() => {
    // デバッグログ
    console.log('AdminDashboard - セッション情報:', session);
    
    // 管理者権限確認用関数
    const checkAdminAccess = () => {
      // セッションでの確認
      const isAdminBySession = session?.user?.isAdmin || session?.user?.role === 'admin';
      
      // ローカルストレージでの確認
      const adminToken = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
      const hasAdminToken = !!adminToken && adminToken.length > 10;
      
      // どちらかの方法で管理者権限があれば許可
      return isAdminBySession || hasAdminToken;
    };
    
    const isAdmin = checkAdminAccess();
    setHasAdminAccess(isAdmin);
    
    if (isAdmin) {
      console.log('管理者ユーザーを確認、ダッシュボードデータを取得します');
      fetchStats();
    } else {
      setLoading(false);
    }
  }, [session]);

  // ログアウト処理
  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    router.push('/admin/login');
  };

  if (loading) {
    return (
      <AdminGuard>
        <AdminLayout>
          <Container maxW="container.xl" py={8}>
            <Center h="50vh">
              <VStack spacing={4}>
                <Spinner size="xl" color="cyan.500" thickness="4px" />
                <Text>ダッシュボードデータを読み込み中...</Text>
              </VStack>
            </Center>
          </Container>
        </AdminLayout>
      </AdminGuard>
    );
  }

  if (error) {
    return (
      <AdminGuard>
        <AdminLayout>
          <Alert status="error" variant="subtle" flexDirection="column" alignItems="center" justifyContent="center" textAlign="center" height="200px">
            <AlertIcon boxSize="40px" mr={0} />
            <Text mt={4} mb={1} fontSize="lg">
              エラーが発生しました
            </Text>
            <Text maxW="sm">{error}</Text>
          </Alert>
        </AdminLayout>
      </AdminGuard>
    );
  }

  if (!hasAdminAccess) {
    return (
      <Container maxW="container.xl" py={8}>
        <VStack spacing={6} align="center">
          <Heading size="lg">管理者権限がありません</Heading>
          <Text>このページにアクセスする権限がありません。管理者としてログインしてください。</Text>
          <Button colorScheme="cyan" onClick={() => router.push('/admin/login')}>
            管理者ログインページへ
          </Button>
        </VStack>
      </Container>
    );
  }

  // 前日比の増減率を計算
  const orderGrowth = stats ? ((stats.todayOrders - stats.yesterdayOrders) / stats.yesterdayOrders) * 100 : 0;
  const revenueGrowth = stats ? ((stats.todayRevenue - stats.yesterdayRevenue) / stats.yesterdayRevenue) * 100 : 0;

  return (
    <AdminGuard>
      <Head>
        <title>管理者ダッシュボード | Shop</title>
      </Head>
      
      <AdminLayout>
        <Box py={6}>
          <Container maxW="container.xl">
            <HStack justifyContent="space-between" mb={8}>
              <VStack align="flex-start">
                <Heading size="lg">管理者ダッシュボード</Heading>
                <Text color="gray.500">ショップの統計データと管理機能</Text>
              </VStack>
              
              <Button colorScheme="red" onClick={handleLogout} variant="outline">
                ログアウト
              </Button>
            </HStack>
            
            {/* 注文と売上の統計 */}
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={10} mb={10}>
              <Card>
                <CardBody>
                  <Flex align="center" mb={4}>
                    <Icon as={FaShoppingCart} boxSize={8} color="blue.500" mr={4} />
                    <Heading size="md">本日の注文</Heading>
                  </Flex>
                  <StatGroup>
                    <Stat>
                      <StatNumber>{stats?.todayOrders || 0}</StatNumber>
                      <StatLabel>注文数</StatLabel>
                      <StatHelpText>
                        <StatArrow type={orderGrowth >= 0 ? 'increase' : 'decrease'} />
                        {Math.abs(orderGrowth).toFixed(1)}% (前日比)
                      </StatHelpText>
                    </Stat>
                    <Stat>
                      <StatNumber>¥{stats?.todayRevenue?.toLocaleString() || 0}</StatNumber>
                      <StatLabel>売上</StatLabel>
                      <StatHelpText>
                        <StatArrow type={revenueGrowth >= 0 ? 'increase' : 'decrease'} />
                        {Math.abs(revenueGrowth).toFixed(1)}% (前日比)
                      </StatHelpText>
                    </Stat>
                  </StatGroup>
                </CardBody>
              </Card>
              
              <Card>
                <CardBody>
                  <Flex align="center" mb={4}>
                    <Icon as={FaMoneyBillWave} boxSize={8} color="green.500" mr={4} />
                    <Heading size="md">前日の注文</Heading>
                  </Flex>
                  <StatGroup>
                    <Stat>
                      <StatNumber>{stats?.yesterdayOrders || 0}</StatNumber>
                      <StatLabel>注文数</StatLabel>
                    </Stat>
                    <Stat>
                      <StatNumber>¥{stats?.yesterdayRevenue?.toLocaleString() || 0}</StatNumber>
                      <StatLabel>売上</StatLabel>
                    </Stat>
                  </StatGroup>
                </CardBody>
              </Card>
            </SimpleGrid>
            
            {/* 他の統計データ */}
            <SimpleGrid columns={{ base: 1, md: 4 }} spacing={6}>
              <Card>
                <CardBody>
                  <Stack align="center">
                    <Icon as={FaUsers} boxSize={8} color="purple.500" />
                    <Stat textAlign="center">
                      <StatNumber>{stats?.totalUsers || 0}</StatNumber>
                      <StatLabel>総ユーザー数</StatLabel>
                    </Stat>
                  </Stack>
                </CardBody>
              </Card>
              
              <Card>
                <CardBody>
                  <Stack align="center">
                    <Icon as={FaBox} boxSize={8} color="orange.500" />
                    <Stat textAlign="center">
                      <StatNumber>{stats?.totalProducts || 0}</StatNumber>
                      <StatLabel>総商品数</StatLabel>
                    </Stat>
                  </Stack>
                </CardBody>
              </Card>
              
              <Card>
                <CardBody>
                  <Stack align="center">
                    <Icon as={FaShoppingCart} boxSize={8} color="blue.500" />
                    <Stat textAlign="center">
                      <StatNumber>{stats?.totalOrders || 0}</StatNumber>
                      <StatLabel>総注文数</StatLabel>
                    </Stat>
                  </Stack>
                </CardBody>
              </Card>
              
              <Card>
                <CardBody>
                  <Stack align="center">
                    <Icon as={FaShoppingCart} boxSize={8} color="red.500" />
                    <Stat textAlign="center">
                      <StatNumber>{stats?.pendingOrders || 0}</StatNumber>
                      <StatLabel>保留中の注文</StatLabel>
                    </Stat>
                  </Stack>
                </CardBody>
              </Card>
            </SimpleGrid>
          </Container>
        </Box>
      </AdminLayout>
    </AdminGuard>
  );
} 