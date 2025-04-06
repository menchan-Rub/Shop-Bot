import React, { useState, useEffect } from 'react';
import {
  Box, Container, Heading, Text, SimpleGrid, Flex, 
  Button, Table, Thead, Tbody, Tr, Th, Td, 
  useColorModeValue, HStack, Icon, VStack, 
  Skeleton, Badge, Avatar, Stat, StatLabel, 
  StatNumber, StatHelpText, Tabs, TabList, 
  Tab, TabPanels, TabPanel, Image, Link, Center, Spinner,
  useToast,
  Grid
} from '@chakra-ui/react';
import NextLink from 'next/link';
import { useSession } from 'next-auth/react';
import { FiUsers, FiShoppingBag, FiDollarSign, FiBarChart2, FiCheckCircle, FiClock, FiRefreshCw, FiCalendar, FiSettings, FiAlertCircle, FiActivity } from 'react-icons/fi';
import axios from 'axios';
import { getWithAuth } from '../../lib/api';
import DashboardCard from '../../components/admin/DashboardCard';
import dynamic from 'next/dynamic';
import AdminLayout from '../../components/admin/AdminLayout';
import AdminCard from '../../components/admin/AdminCard';
import { useRouter } from 'next/router';

// クライアントサイドのみでレンダリングするチャートコンポーネント
const DynamicLineChart = dynamic(
  () => import('../../components/admin/SalesChart'),
  { ssr: false }
);

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>({});
  const [recentOrders, setRecentOrders] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  const [hasAdminAccess, setHasAdminAccess] = useState(false);
  const toast = useToast();
  const router = useRouter();

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const secondaryTextColor = useColorModeValue('gray.600', 'gray.400');
  const hoverBgColor = useColorModeValue('brand.50', 'gray.700');

  useEffect(() => {
    // デバッグログ
    console.log('AdminDashboard - セッション情報:', session);
    
    // より明確な権限チェックロジックに修正
    const checkAdminAccess = () => {
      // セッションでの確認
      const isAdminBySession = session?.user?.isAdmin || session?.user?.role === 'admin';
      
      // ローカルストレージでの確認
      const adminToken = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
      const hasAdminToken = !!adminToken && adminToken.length > 10; // トークンが存在し、最低限の長さがあることを確認
      
      console.log('管理者権限チェック:', { isAdminBySession, hasAdminToken, adminToken });
      
      // どちらかの方法で管理者権限があれば許可
      return isAdminBySession || hasAdminToken;
    };
    
    const isAdmin = checkAdminAccess();
    setHasAdminAccess(isAdmin);
    
    if (isAdmin) {
      console.log('管理者ユーザーを確認、ダッシュボードデータを取得します');
      fetchDashboardData();
    } else {
      setLoading(false);
    }
  }, [session]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // ローカルストレージのadminTokenも確認するロジックを追加
      const adminToken = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
      
      if (!adminToken) {
        console.error('管理者トークンがありません');
        window.location.href = '/admin/login?error=unauthorized';
        return;
      }
      
      try {
        // クライアントサイドのAPIルートを使用
        const response = await axios.get('/api/admin/dashboard-stats', {
          headers: {
            Authorization: `Bearer ${adminToken}`
          }
        });
        
        const data = response.data;
        
        // データを安全に設定
        setStats(data || {});
        setRecentOrders(data?.recentOrders || []);
        setRecentUsers(data?.recentUsers || []);
      } catch (apiError) {
        console.error('API呼び出しエラー:', apiError);
        
        toast({
          title: "データの取得に失敗しました",
          description: "デモデータを表示します",
          status: "warning",
          duration: 5000,
          isClosable: true,
        });
        
        // エラー時はデモデータを設定
        setStats({
          todayOrders: 12,
          todayRevenue: 158000,
          yesterdayOrders: 8,
          yesterdayRevenue: 95000,
          totalUsers: 254,
          totalProducts: 89,
          totalOrders: 423,
          pendingOrders: 7,
          
          // 互換性のため古いフィールドも含める
          todaySales: 158000,
          totalSales: 2450000,
          ordersChange: 50,
          salesChange: 66.3,
          activeUsers: 87,
          outOfStock: 3,
          lowStock: 5,
          newUsers: 12,
          salesData: Array(7).fill(0).map((_, i) => ({
            date: new Date(Date.now() - i * 86400000).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' }),
            sales: Math.floor(Math.random() * 200000) + 50000,
            orders: Math.floor(Math.random() * 20) + 5
          }))
        });
      }
    } catch (error) {
      console.error('ダッシュボードデータ取得エラー:', error);
      
      // エラー時は空のデータを設定
      setStats({});
      setRecentOrders([]);
      setRecentUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = () => {
    fetchDashboardData();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', { 
      style: 'currency', 
      currency: 'JPY',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getOrderStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge colorScheme="yellow">処理中</Badge>;
      case 'completed':
        return <Badge colorScheme="green">完了</Badge>;
      case 'cancelled':
        return <Badge colorScheme="red">キャンセル</Badge>;
      case 'shipped':
        return <Badge colorScheme="blue">発送済</Badge>;
      default:
        return <Badge>不明</Badge>;
    }
  };

  // ログイン状態チェック処理の修正
  if (loading) {
    return (
      <AdminLayout>
        <Container maxW="container.md" py={8}>
          <VStack spacing={6} align="center">
            <Spinner size="xl" color="cyan.500" thickness="4px" speed="0.65s" />
            <Text mt={4}>ダッシュボードデータを読み込み中...</Text>
          </VStack>
        </Container>
      </AdminLayout>
    );
  }

  // ローカルストレージのadminTokenも確認するロジックを追加
  const adminToken = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
  const hasAdminPermission = session?.user?.isAdmin || adminToken;

  if (!hasAdminPermission) {
    return (
      <Container maxW="container.xl" py={8}>
        <VStack spacing={6} textAlign="center">
          <Heading size="lg">管理者権限がありません</Heading>
          <Text>このページにアクセスする権限がありません。管理者としてログインしてください。</Text>
          <Button colorScheme="cyan" onClick={() => window.location.href = '/admin/login'}>
            管理者ログインページへ
          </Button>
        </VStack>
      </Container>
    );
  }

  return (
    <AdminLayout>
      <Container maxW="container.xl" py={8}>
        <Box mb={8}>
          <Heading size="xl" mb={2}>管理者ダッシュボード</Heading>
          <Text color="gray.500">サイト全体の統計と最新情報を確認できます</Text>
        </Box>

        {/* 統計カード */}
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} mb={8}>
          <AdminCard 
            title="今日の売上"
            description="過去24時間の売上金額"
            icon={FiDollarSign}
            iconColor="green.500"
          >
            <Stat>
              <StatNumber fontSize="3xl" fontWeight="bold" mb={2}>
                {loading ? (
                  <Skeleton height="36px" width="80px" />
                ) : (
                  `¥${stats.todayRevenue?.toLocaleString() || 0}`
                )}
              </StatNumber>
            </Stat>
            <HStack>
              <Text color="gray.500" fontSize="sm">前日比</Text>
              <Badge colorScheme={stats.salesChange > 0 ? "green" : "red"}>
                {stats.salesChange > 0 ? "+" : ""}{stats.salesChange}%
              </Badge>
            </HStack>
          </AdminCard>

          <AdminCard 
            title="今日の注文"
            description="過去24時間の注文数"
            icon={FiShoppingBag}
            iconColor="orange.500"
          >
            <Stat>
              <StatNumber fontSize="3xl" fontWeight="bold" mb={2}>
                {loading ? (
                  <Skeleton height="36px" width="80px" />
                ) : (
                  stats.todayOrders || 0
                )}
              </StatNumber>
            </Stat>
            <HStack>
              <Text color="gray.500" fontSize="sm">前日比</Text>
              <Badge colorScheme={stats.ordersChange > 0 ? "green" : "red"}>
                {stats.ordersChange > 0 ? "+" : ""}{stats.ordersChange}%
              </Badge>
            </HStack>
          </AdminCard>

          <AdminCard 
            title="アクティブユーザー"
            description="今月のアクティブユーザー"
            icon={FiUsers}
            iconColor="blue.500"
          >
            <Stat>
              <StatNumber fontSize="3xl" fontWeight="bold" mb={2}>
                {loading ? (
                  <Skeleton height="36px" width="80px" />
                ) : (
                  stats.activeUsers || 0
                )}
              </StatNumber>
            </Stat>
            <HStack>
              <Text color="gray.500" fontSize="sm">合計</Text>
              <Text color="blue.500" fontWeight="medium">{stats.totalUsers || 0}人</Text>
            </HStack>
          </AdminCard>

          <AdminCard 
            title="在庫状況"
            description="商品の在庫ステータス"
            icon={FiAlertCircle}
            iconColor="red.500"
          >
            <Stat>
              <StatNumber fontSize="3xl" fontWeight="bold" mb={2}>
                {loading ? (
                  <Skeleton height="36px" width="80px" />
                ) : (
                  stats.outOfStock || 0
                )}
              </StatNumber>
            </Stat>
            <HStack>
              <Text color="gray.500" fontSize="sm">残り僅か</Text>
              <Badge colorScheme="orange">{stats.lowStock || 0}個</Badge>
            </HStack>
          </AdminCard>
        </SimpleGrid>

        {/* 売上チャート */}
        <AdminCard 
          title="売上推移"
          description="過去7日間の売上と注文数"
          icon={FiActivity}
          mb={8}
          h="400px"
        >
          {stats.salesData ? (
            <DynamicLineChart data={stats.salesData} />
          ) : (
            <Center h="300px">
              <Spinner color="cyan.500" />
            </Center>
          )}
        </AdminCard>

        {/* 最近の注文と新規ユーザー */}
        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
          <AdminCard 
            title="最近の注文"
            icon={FiClock}
            description="最新10件の注文"
            action={
              <Button
                size="sm"
                variant="outline"
                leftIcon={<Icon as={FiShoppingBag} />}
                onClick={() => router.push('/admin/orders')}
              >
                全ての注文
              </Button>
            }
            noPadding
          >
            <Table variant="simple" size="sm">
              <Thead>
                <Tr>
                  <Th>注文ID</Th>
                  <Th>顧客</Th>
                  <Th isNumeric>金額</Th>
                  <Th>ステータス</Th>
                </Tr>
              </Thead>
              <Tbody>
                {recentOrders.length > 0 ? (
                  recentOrders.map((order: any) => (
                    <Tr key={order._id} _hover={{ bg: hoverBgColor }} cursor="pointer" onClick={() => router.push(`/admin/orders/${order._id}`)}>
                      <Td fontWeight="medium">{order._id.substring(0, 8)}...</Td>
                      <Td>{order.user?.name || '不明'}</Td>
                      <Td isNumeric>¥{order.total.toLocaleString()}</Td>
                      <Td>
                        <Badge
                          colorScheme={
                            order.status === 'completed' ? 'green' :
                            order.status === 'paid' ? 'blue' :
                            order.status === 'pending' ? 'yellow' : 'red'
                          }
                          borderRadius="full"
                          px={2}
                        >
                          {order.status === 'completed' ? '完了' :
                           order.status === 'paid' ? '支払済' :
                           order.status === 'pending' ? '保留中' : 'キャンセル'}
                        </Badge>
                      </Td>
                    </Tr>
                  ))
                ) : (
                  <Tr>
                    <Td colSpan={4} textAlign="center" py={4}>
                      最近の注文はありません
                    </Td>
                  </Tr>
                )}
              </Tbody>
            </Table>
          </AdminCard>

          <AdminCard 
            title="新規ユーザー"
            icon={FiUsers}
            description="最近登録した10名のユーザー"
            action={
              <Button
                size="sm"
                variant="outline"
                leftIcon={<Icon as={FiUsers} />}
                onClick={() => router.push('/admin/users')}
              >
                全てのユーザー
              </Button>
            }
          >
            {recentUsers.length > 0 ? (
              <VStack spacing={4} align="stretch">
                {recentUsers.map((user: any) => (
                  <Flex key={user._id} align="center" justify="space-between">
                    <HStack>
                      <Avatar 
                        size="sm" 
                        name={user.name} 
                        src={user.image}
                      />
                      <Box>
                        <Text fontWeight="medium">{user.name}</Text>
                        <Text fontSize="xs" color={secondaryTextColor}>{user.email}</Text>
                      </Box>
                    </HStack>
                    <Badge size="sm">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </Badge>
                  </Flex>
                ))}
              </VStack>
            ) : (
              <Text textAlign="center" py={4}>
                最近のユーザー登録はありません
              </Text>
            )}
          </AdminCard>
        </SimpleGrid>

        {/* クイックアクセスボタン */}
        <AdminCard 
          title="管理メニュー"
          icon={FiSettings}
          description="よく使う管理機能へのショートカット"
          mt={6}
        >
          <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
            <Button
              size="lg"
              py={8}
              colorScheme="blue"
              variant="outline"
              leftIcon={<Icon as={FiShoppingBag} boxSize="20px" />}
              onClick={() => router.push('/admin/products')}
              height="auto"
            >
              <VStack>
                <Text>商品管理</Text>
                <Text fontSize="xs" color="gray.500">商品の追加と編集</Text>
              </VStack>
            </Button>
            
            <Button
              size="lg"
              py={8}
              colorScheme="orange"
              variant="outline"
              leftIcon={<Icon as={FiUsers} boxSize="20px" />}
              onClick={() => router.push('/admin/users')}
              height="auto"
            >
              <VStack>
                <Text>ユーザー管理</Text>
                <Text fontSize="xs" color="gray.500">ユーザー情報の確認</Text>
              </VStack>
            </Button>
            
            <Button
              size="lg"
              py={8}
              colorScheme="green"
              variant="outline"
              leftIcon={<Icon as={FiDollarSign} boxSize="20px" />}
              onClick={() => router.push('/admin/orders')}
              height="auto"
            >
              <VStack>
                <Text>注文管理</Text>
                <Text fontSize="xs" color="gray.500">注文の確認と処理</Text>
              </VStack>
            </Button>
            
            <Button
              size="lg"
              py={8}
              colorScheme="purple"
              variant="outline"
              leftIcon={<Icon as={FiSettings} boxSize="20px" />}
              onClick={() => router.push('/admin/settings')}
              height="auto"
            >
              <VStack>
                <Text>システム設定</Text>
                <Text fontSize="xs" color="gray.500">サイト全体の設定</Text>
              </VStack>
            </Button>
          </SimpleGrid>
        </AdminCard>
      </Container>
    </AdminLayout>
  );
} 