import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  Box, Container, Heading, Text, Button, VStack,
  HStack, SimpleGrid, Table, Tbody, Tr, Th, Td,
  useToast, Spinner, Flex, Badge, Divider,
  Select, FormControl, FormLabel, Textarea,
  AlertDialog, AlertDialogOverlay, AlertDialogContent,
  AlertDialogHeader, AlertDialogBody, AlertDialogFooter,
  useDisclosure
} from '@chakra-ui/react';
import { useSession } from 'next-auth/react';
import axios from 'axios';
import Link from 'next/link';
import { FaArrowLeft, FaDownload } from 'react-icons/fa';
import AdminLayout from '../../../components/admin/AdminLayout';

type OrderItem = {
  _id: string;
  product: {
    _id: string;
    name: string;
    price: number;
    images: string[];
  };
  quantity: number;
};

type Order = {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
  };
  items: OrderItem[];
  total: number;
  status: 'pending' | 'paid' | 'completed' | 'cancelled';
  discordId: string;
  note: string;
  adminNote: string;
  createdAt: string;
  updatedAt: string;
};

const OrderDetail = () => {
  const router = useRouter();
  const { id } = router.query;
  const { data: session } = useSession();
  const toast = useToast();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [adminNote, setAdminNote] = useState('');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = React.useRef<HTMLButtonElement>(null);

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
    
    if (isAdmin && id) {
      fetchOrder(id as string);
    } else {
      setLoading(false);
    }
  }, [session, id]);

  const fetchOrder = async (orderId: string) => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/admin/orders/${orderId}`);
      setOrder(response.data);
      setNewStatus(response.data.status);
      setAdminNote(response.data.adminNote || '');
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
      const demoOrder = {
        _id: orderId || 'order123',
        user: {
          _id: 'user1',
          name: 'サンプルユーザー',
          email: 'demo@example.com'
        },
        items: [
          {
            _id: 'item1',
            product: {
              _id: 'prod1',
              name: 'サンプル商品',
              price: 1500,
              images: ['/placeholder-image.jpg']
            },
            quantity: 2
          },
          {
            _id: 'item2',
            product: {
              _id: 'prod2',
              name: 'プレミアム商品',
              price: 5000,
              images: ['/placeholder-image.jpg']
            },
            quantity: 1
          }
        ],
        total: 8000,
        status: 'pending',
        discordId: 'sample#1234',
        note: 'これはサンプル注文です',
        adminNote: '管理者メモサンプル',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      setOrder(demoOrder);
      setNewStatus(demoOrder.status);
      setAdminNote(demoOrder.adminNote);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setNewStatus(e.target.value);
  };

  const handleAdminNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setAdminNote(e.target.value);
  };

  const handleUpdateOrder = async () => {
    try {
      setUpdating(true);
      
      await axios.put(`/api/admin/orders/${id}`, {
        status: newStatus,
        adminNote
      });
      
      toast({
        title: '注文を更新しました',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      if (order) {
        setOrder({
          ...order,
          status: newStatus as any,
          adminNote
        });
      }
    } catch (error) {
      console.error('注文更新エラー:', error);
      toast({
        title: 'エラーが発生しました',
        description: '注文の更新に失敗しました',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleCancelOrder = async () => {
    try {
      await axios.put(`/api/admin/orders/${id}`, {
        status: 'cancelled',
        adminNote: adminNote
      });
      
      toast({
        title: '注文をキャンセルしました',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      if (order) {
        setOrder({
          ...order,
          status: 'cancelled',
          adminNote
        });
      }
      
      setNewStatus('cancelled');
      onClose();
    } catch (error) {
      console.error('注文キャンセルエラー:', error);
      toast({
        title: 'エラーが発生しました',
        description: '注文のキャンセルに失敗しました',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

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

  // ローカルストレージのadminTokenも確認するロジックを追加
  const adminToken = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
  const hasAdminPermission = session?.user?.isAdmin || adminToken;

  if (loading) {
    return (
      <Container maxW="container.md" py={8}>
        <VStack spacing={6} align="center">
          <Spinner size="xl" color="cyan.500" thickness="4px" speed="0.65s" />
          <Text mt={4}>注文データを読み込み中...</Text>
        </VStack>
      </Container>
    );
  }

  if (!hasAdminPermission) {
    return (
      <Container maxW="container.md" py={8}>
        <VStack spacing={6} align="center">
          <Heading>アクセス権限がありません</Heading>
          <Text>このページにアクセスするには管理者権限が必要です</Text>
          <Button 
            colorScheme="cyan"
            onClick={() => router.push('/')}
          >
            トップページへ戻る
          </Button>
        </VStack>
      </Container>
    );
  }

  if (!order) {
    return (
      <Container maxW="container.md" py={8}>
        <VStack spacing={6} align="center">
          <Heading>注文が見つかりません</Heading>
          <Text>指定された注文が見つかりませんでした</Text>
          <Button 
            colorScheme="cyan" 
            leftIcon={<FaArrowLeft />}
            onClick={() => router.push('/admin/orders')}
          >
            注文一覧へ戻る
          </Button>
        </VStack>
      </Container>
    );
  }

  return (
    <Container maxW="container.lg" py={8}>
      <VStack spacing={8} align="stretch">
        <HStack>
          <Button
            leftIcon={<FaArrowLeft />}
            variant="outline"
            colorScheme="gray"
            mb={8}
            onClick={() => router.push('/admin/orders')}
          >
            注文一覧へ戻る
          </Button>
          <Box flex="1">
            <Heading as="h1" size="xl" textAlign="center">
              注文詳細
            </Heading>
          </Box>
        </HStack>

        {/* 注文情報 */}
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
          <Box p={5} shadow="md" borderWidth="1px" borderRadius="md">
            <Heading size="md" mb={4}>
              注文情報
            </Heading>
            <VStack align="stretch" spacing={3}>
              <HStack>
                <Text fontWeight="bold" w="120px">
                  注文番号:
                </Text>
                <Text>{order._id}</Text>
              </HStack>
              <HStack>
                <Text fontWeight="bold" w="120px">
                  注文日:
                </Text>
                <Text>{new Date(order.createdAt).toLocaleString()}</Text>
              </HStack>
              <HStack>
                <Text fontWeight="bold" w="120px">
                  合計金額:
                </Text>
                <Text>{order.total.toLocaleString()}ポイント</Text>
              </HStack>
              <HStack>
                <Text fontWeight="bold" w="120px">
                  ステータス:
                </Text>
                <Box>{getStatusBadge(order.status)}</Box>
              </HStack>
            </VStack>
          </Box>

          <Box p={5} shadow="md" borderWidth="1px" borderRadius="md">
            <Heading size="md" mb={4}>
              顧客情報
            </Heading>
            <VStack align="stretch" spacing={3}>
              <HStack>
                <Text fontWeight="bold" w="120px">
                  ユーザー:
                </Text>
                <Text>{order.user?.name || '不明'}</Text>
              </HStack>
              <HStack>
                <Text fontWeight="bold" w="120px">
                  メール:
                </Text>
                <Text>{order.user?.email || '不明'}</Text>
              </HStack>
              <HStack>
                <Text fontWeight="bold" w="120px">
                  Discord ID:
                </Text>
                <Text>{order.discordId || '-'}</Text>
              </HStack>
              <HStack alignItems="flex-start">
                <Text fontWeight="bold" w="120px">
                  備考:
                </Text>
                <Text>{order.note || 'なし'}</Text>
              </HStack>
            </VStack>
          </Box>
        </SimpleGrid>

        {/* 注文アイテム */}
        <Box p={5} shadow="md" borderWidth="1px" borderRadius="md">
          <Heading size="md" mb={4}>
            注文アイテム
          </Heading>
          <Table variant="simple">
            <Tbody>
              {order.items.map((item) => (
                <Tr key={item._id}>
                  <Td width="80px">
                    <Box
                      width="60px"
                      height="60px"
                      borderRadius="md"
                      overflow="hidden"
                      bgImage={`url(${item.product.images?.[0] || '/placeholder-image.jpg'})`}
                      bgSize="cover"
                      bgPosition="center"
                    />
                  </Td>
                  <Td fontWeight="medium">
                    <Text 
                      color="blue.500" 
                      cursor="pointer"
                      onClick={() => router.push(`/products/${item.product._id}`)}
                    >
                      {item.product.name}
                    </Text>
                  </Td>
                  <Td>{item.product.price.toLocaleString()}ポイント</Td>
                  <Td>x {item.quantity}</Td>
                  <Td isNumeric>
                    {(item.product.price * item.quantity).toLocaleString()}ポイント
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>

        {/* 注文管理 */}
        <Box p={5} shadow="md" borderWidth="1px" borderRadius="md">
          <Heading size="md" mb={4}>
            注文管理
          </Heading>
          <VStack spacing={4} align="stretch">
            <FormControl>
              <FormLabel>ステータス変更</FormLabel>
              <Select
                value={newStatus}
                onChange={handleStatusChange}
                isDisabled={order.status === 'cancelled'}
              >
                <option value="pending">支払い待ち</option>
                <option value="paid">支払い済み</option>
                <option value="completed">完了</option>
                <option value="cancelled">キャンセル</option>
              </Select>
            </FormControl>

            <FormControl>
              <FormLabel>管理者メモ</FormLabel>
              <Textarea
                value={adminNote}
                onChange={handleAdminNoteChange}
                placeholder="注文に関するメモを入力（顧客には表示されません）"
                rows={4}
              />
            </FormControl>

            <Divider />

            <HStack spacing={4} justify="flex-end">
              <Button
                colorScheme="blue"
                onClick={handleUpdateOrder}
                isLoading={updating}
                isDisabled={order.status === 'cancelled'}
              >
                更新する
              </Button>
              {order.status !== 'cancelled' && (
                <Button
                  colorScheme="red"
                  variant="outline"
                  onClick={onOpen}
                >
                  注文をキャンセル
                </Button>
              )}
            </HStack>
          </VStack>
        </Box>

        <Button
          size="sm"
          leftIcon={<FaDownload />}
          colorScheme="blue"
          variant="outline"
          onClick={() => router.push(`/api/admin/orders/${order._id}/invoice`)}
        >
          請求書をダウンロード
        </Button>
      </VStack>

      <AlertDialog
        isOpen={isOpen}
        leastDestructiveRef={cancelRef}
        onClose={onClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              注文をキャンセル
            </AlertDialogHeader>

            <AlertDialogBody>
              本当にこの注文をキャンセルしますか？この操作は元に戻せません。
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose}>
                いいえ
              </Button>
              <Button colorScheme="red" onClick={handleCancelOrder} ml={3}>
                はい、キャンセルします
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Container>
  );
};

export default OrderDetail; 