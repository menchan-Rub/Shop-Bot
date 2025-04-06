import { useState, useEffect } from 'react';
import {
  Box, Container, Heading, Text, Button, VStack,
  HStack, Table, Thead, Tbody, Tr, Th, Td,
  useToast, Spinner, Flex, Badge, Select,
  InputGroup, InputLeftElement, Input
} from '@chakra-ui/react';
import { useSession } from 'next-auth/react';
import axios from 'axios';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FaSearch, FaSort, FaEye } from 'react-icons/fa';
import { GetServerSideProps } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../api/auth/[...nextauth]';
import { getWithAuth } from '../../../lib/api';
import AdminLayout from '../../../components/admin/AdminLayout';

type Order = {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
  };
  items: Array<{
    product: {
      _id: string;
      name: string;
      price: number;
    };
    quantity: number;
  }>;
  total: number;
  status: 'pending' | 'paid' | 'completed' | 'cancelled';
  discordId: string;
  note: string;
  createdAt: string;
  updatedAt: string;
};

const OrdersManagement = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const toast = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortField, setSortField] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

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
      fetchOrders();
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
  }, [session, sortField, sortOrder, statusFilter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const url = `/api/admin/orders?sort=${sortField}&order=${sortOrder}${statusFilter ? `&status=${statusFilter}` : ''}`;
      const response = await getWithAuth(url);
      setOrders(response.data || []);
    } catch (error) {
      console.error('注文取得エラー:', error);
      toast({
        title: 'エラーが発生しました',
        description: 'デモデータを表示します',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
      
      // デモデータをセット
      setOrders([
        {
          _id: 'order123',
          user: {
            _id: 'user1',
            name: 'サンプルユーザー',
            email: 'sample@example.com'
          },
          items: [
            {
              product: {
                _id: 'prod1',
                name: 'サンプル商品',
                price: 1500
              },
              quantity: 2
            }
          ],
          total: 3000,
          status: 'pending',
          discordId: 'sample#1234',
          note: 'これはサンプル注文です',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          _id: 'order456',
          user: {
            _id: 'user2',
            name: '山田太郎',
            email: 'yamada@example.com'
          },
          items: [
            {
              product: {
                _id: 'prod2',
                name: 'プレミアム商品',
                price: 5000
              },
              quantity: 1
            }
          ],
          total: 5000,
          status: 'completed',
          discordId: 'yamada#5678',
          note: '',
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          updatedAt: new Date(Date.now() - 86400000).toISOString()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSortChange = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleStatusFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value);
  };

  // フィルタリングされた注文
  const filteredOrders = orders?.filter(order => {
    const discordIdMatch = order.discordId?.toLowerCase().includes(searchTerm.toLowerCase());
    const orderIdMatch = order._id.toLowerCase().includes(searchTerm.toLowerCase());
    const userMatch = order.user?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const emailMatch = order.user?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return (discordIdMatch || orderIdMatch || userMatch || emailMatch);
  }) || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge colorScheme="yellow">支払い待ち</Badge>;
      case 'paid':
        return <Badge colorScheme="blue">支払い済み</Badge>;
      case 'completed':
        return <Badge colorScheme="green">完了</Badge>;
      case 'cancelled':
        return <Badge colorScheme="red">キャンセル</Badge>;
      default:
        return <Badge>不明</Badge>;
    }
  };

  // ローディング中表示を修正
  if (loading) {
    return (
      <AdminLayout>
        <Container maxW="container.md" py={8}>
          <VStack spacing={6} align="center">
            <Spinner size="xl" color="cyan.500" thickness="4px" speed="0.65s" />
            <Text mt={4}>注文データを読み込み中...</Text>
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
    <AdminLayout>
      <Container maxW="container.xl" py={8}>
        <VStack spacing={8} align="stretch">
          <Box>
            <Heading as="h1" size="2xl" mb={4}>
              注文管理
            </Heading>
            <Text color="gray.500" mb={4}>
              注文の確認と処理を行います
            </Text>

            <HStack mb={6}>
              <Button 
                variant="outline"
                colorScheme="cyan"
                size="md"
                onClick={() => window.location.href = '/admin'}
              >
                ダッシュボードへ戻る
              </Button>
            </HStack>

            <HStack mb={6} spacing={4}>
              <InputGroup maxW="300px">
                <InputLeftElement pointerEvents="none">
                  <FaSearch color="gray.300" />
                </InputLeftElement>
                <Input
                  placeholder="検索..."
                  value={searchTerm}
                  onChange={handleSearch}
                />
              </InputGroup>

              <Select
                placeholder="ステータスでフィルター"
                value={statusFilter}
                onChange={handleStatusFilter}
                maxW="200px"
              >
                <option value="">すべてのステータス</option>
                <option value="pending">支払い待ち</option>
                <option value="paid">支払い済み</option>
                <option value="completed">完了</option>
                <option value="cancelled">キャンセル</option>
              </Select>
            </HStack>
          </Box>

          <Box overflowX="auto">
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>
                    <HStack spacing={1} cursor="pointer" onClick={() => handleSortChange('_id')}>
                      <Text>注文番号</Text>
                      <FaSort size="12px" />
                    </HStack>
                  </Th>
                  <Th>ユーザー</Th>
                  <Th>Discord ID</Th>
                  <Th>
                    <HStack spacing={1} cursor="pointer" onClick={() => handleSortChange('total')}>
                      <Text>合計</Text>
                      <FaSort size="12px" />
                    </HStack>
                  </Th>
                  <Th>ステータス</Th>
                  <Th>
                    <HStack spacing={1} cursor="pointer" onClick={() => handleSortChange('createdAt')}>
                      <Text>注文日</Text>
                      <FaSort size="12px" />
                    </HStack>
                  </Th>
                  <Th>操作</Th>
                </Tr>
              </Thead>
              <Tbody>
                {filteredOrders.map((order) => (
                  <Tr key={order._id}>
                    <Td fontWeight="medium">{order._id}</Td>
                    <Td>{order.user?.name || '不明'}</Td>
                    <Td>{order.discordId || '-'}</Td>
                    <Td>{order.total.toLocaleString()}ポイント</Td>
                    <Td>{getStatusBadge(order.status)}</Td>
                    <Td>{new Date(order.createdAt).toLocaleString()}</Td>
                    <Td>
                      <Button
                        size="sm"
                        leftIcon={<FaEye />}
                        colorScheme="blue"
                        onClick={() => window.location.href = `/admin/orders/${order._id}`}
                      >
                        詳細
                      </Button>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>

            {filteredOrders.length === 0 && (
              <Flex justify="center" py={10}>
                <Text color="gray.500">注文が見つかりませんでした</Text>
              </Flex>
            )}
          </Box>
        </VStack>
      </Container>
    </AdminLayout>
  );
};

export default OrdersManagement; 