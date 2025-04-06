import React, { useEffect, useState } from 'react';
import {
  VStack, Heading, Box, Text, Badge, Spinner,
  Table, Thead, Tbody, Tr, Th, Td, Button,
  useToast, Divider, useColorModeValue, Flex,
  Modal, ModalOverlay, ModalContent, ModalHeader,
  ModalFooter, ModalBody, ModalCloseButton, useDisclosure,
  Tag, HStack, Alert, AlertIcon
} from '@chakra-ui/react';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import { FaDownload, FaEye } from 'react-icons/fa';
import dayjs from 'dayjs';

// 注文の型定義
interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  orderNumber: string;
  date: string;
  status: 'pending' | 'processing' | 'completed' | 'cancelled' | 'refunded';
  total: number;
  items: OrderItem[];
  paymentMethod: string;
  shippingAddress?: string;
}

export default function OrderHistory() {
  const { data: session } = useSession();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  // 注文履歴を取得
  useEffect(() => {
    const fetchOrders = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/orders`,
          {
            headers: {
              Authorization: `Bearer ${session?.accessToken}`
            }
          }
        );

        setOrders(response.data);
      } catch (error) {
        console.error('注文履歴取得エラー:', error);
        setError('注文履歴の取得に失敗しました。後でもう一度お試しください。');
      } finally {
        setIsLoading(false);
      }
    };

    if (session?.accessToken) {
      fetchOrders();
    }
  }, [session?.accessToken]);

  // 注文詳細モーダルを表示
  const showOrderDetails = (order: Order) => {
    setSelectedOrder(order);
    onOpen();
  };

  // 注文書をダウンロード
  const downloadInvoice = async (orderId: string) => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/orders/${orderId}/invoice`,
        {
          headers: {
            Authorization: `Bearer ${session?.accessToken}`
          },
          responseType: 'blob'
        }
      );

      // ダウンロードリンクを作成
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice-${orderId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      toast({
        title: 'ダウンロード完了',
        description: '請求書のダウンロードが完了しました',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('請求書ダウンロードエラー:', error);
      toast({
        title: 'エラー',
        description: '請求書のダウンロードに失敗しました',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // 注文状態に応じたバッジの色を取得
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'yellow';
      case 'processing':
        return 'blue';
      case 'completed':
        return 'green';
      case 'cancelled':
        return 'red';
      case 'refunded':
        return 'purple';
      default:
        return 'gray';
    }
  };

  // 注文状態の日本語表示を取得
  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return '処理待ち';
      case 'processing':
        return '処理中';
      case 'completed':
        return '完了';
      case 'cancelled':
        return 'キャンセル';
      case 'refunded':
        return '返金済';
      default:
        return '不明';
    }
  };

  // 日付のフォーマット
  const formatDate = (dateString: string) => {
    return dayjs(dateString).format('YYYY年MM月DD日 HH:mm');
  };

  if (isLoading) {
    return (
      <Flex justify="center" align="center" minH="200px">
        <Spinner size="xl" />
      </Flex>
    );
  }

  if (error) {
    return (
      <Alert status="error" borderRadius="md">
        <AlertIcon />
        {error}
      </Alert>
    );
  }

  return (
    <VStack spacing={6} align="stretch">
      <Heading as="h2" size="md">注文履歴</Heading>

      {orders.length === 0 ? (
        <Alert status="info" borderRadius="md">
          <AlertIcon />
          注文履歴がありません。
        </Alert>
      ) : (
        <Box overflowX="auto">
          <Table variant="simple" size="sm">
            <Thead>
              <Tr>
                <Th>注文番号</Th>
                <Th>日付</Th>
                <Th>状態</Th>
                <Th isNumeric>合計</Th>
                <Th>アクション</Th>
              </Tr>
            </Thead>
            <Tbody>
              {orders.map((order) => (
                <Tr key={order.id}>
                  <Td>{order.orderNumber}</Td>
                  <Td>{formatDate(order.date)}</Td>
                  <Td>
                    <Badge colorScheme={getStatusColor(order.status)}>
                      {getStatusText(order.status)}
                    </Badge>
                  </Td>
                  <Td isNumeric>¥{order.total.toLocaleString()}</Td>
                  <Td>
                    <HStack spacing={2}>
                      <Button
                        size="xs"
                        leftIcon={<FaEye />}
                        onClick={() => showOrderDetails(order)}
                      >
                        詳細
                      </Button>
                      <Button
                        size="xs"
                        leftIcon={<FaDownload />}
                        onClick={() => downloadInvoice(order.id)}
                      >
                        領収書
                      </Button>
                    </HStack>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      )}

      {/* 注文詳細モーダル */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>注文詳細</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedOrder && (
              <VStack spacing={4} align="stretch">
                <HStack justify="space-between">
                  <Box>
                    <Text fontWeight="bold">注文番号</Text>
                    <Text>{selectedOrder.orderNumber}</Text>
                  </Box>
                  <Badge colorScheme={getStatusColor(selectedOrder.status)} px={2} py={1} borderRadius="md">
                    {getStatusText(selectedOrder.status)}
                  </Badge>
                </HStack>

                <Divider />

                <Box>
                  <Text fontWeight="bold">注文日</Text>
                  <Text>{formatDate(selectedOrder.date)}</Text>
                </Box>

                <Box>
                  <Text fontWeight="bold">お支払い方法</Text>
                  <Text>{selectedOrder.paymentMethod}</Text>
                </Box>

                {selectedOrder.shippingAddress && (
                  <Box>
                    <Text fontWeight="bold">配送先住所</Text>
                    <Text>{selectedOrder.shippingAddress}</Text>
                  </Box>
                )}

                <Divider />

                <Box>
                  <Text fontWeight="bold" mb={2}>注文商品</Text>
                  <Table size="sm" variant="simple">
                    <Thead>
                      <Tr>
                        <Th>商品名</Th>
                        <Th isNumeric>数量</Th>
                        <Th isNumeric>単価</Th>
                        <Th isNumeric>小計</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {selectedOrder.items.map((item) => (
                        <Tr key={item.id}>
                          <Td>{item.name}</Td>
                          <Td isNumeric>{item.quantity}</Td>
                          <Td isNumeric>¥{item.price.toLocaleString()}</Td>
                          <Td isNumeric>¥{(item.quantity * item.price).toLocaleString()}</Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </Box>

                <Divider />

                <Flex justify="space-between">
                  <Text fontWeight="bold">合計金額</Text>
                  <Text fontWeight="bold">¥{selectedOrder.total.toLocaleString()}</Text>
                </Flex>
              </VStack>
            )}
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              閉じる
            </Button>
            {selectedOrder && (
              <Button colorScheme="blue" onClick={() => downloadInvoice(selectedOrder.id)}>
                領収書をダウンロード
              </Button>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>
    </VStack>
  );
} 