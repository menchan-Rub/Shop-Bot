import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  Box, Container, Heading, Text, Button, VStack,
  HStack, SimpleGrid, Table, Tbody, Tr, Th, Td,
  useToast, Spinner, Flex, Badge, Divider,
  FormControl, FormLabel, Input, Switch, FormHelperText,
  Stat, StatLabel, StatNumber, StatHelpText, 
  AlertDialog, AlertDialogOverlay, AlertDialogContent,
  AlertDialogHeader, AlertDialogBody, AlertDialogFooter,
  useDisclosure, Image, Tabs, TabList, TabPanels, Tab, TabPanel,
  Tooltip, IconButton, Textarea, Radio, RadioGroup, Stack
} from '@chakra-ui/react';
import { useSession } from 'next-auth/react';
import axios from 'axios';
import Link from 'next/link';
import { FaArrowLeft, FaShoppingCart, FaUser, FaCalendar, FaSignInAlt, 
  FaKey, FaLock, FaUnlock, FaEnvelope, FaSave, FaUserEdit, FaUserSlash } from 'react-icons/fa';
import AdminLayout from '../../../components/admin/AdminLayout';

type Order = {
  _id: string;
  total: number;
  status: string;
  createdAt: string;
};

type User = {
  _id: string;
  id: string;
  name: string;
  email: string;
  image: string;
  discordId: string;
  isAdmin: boolean;
  isLocked?: boolean;
  createdAt: string;
  lastLogin: string;
  notes?: string;
  orders?: Order[];
  totalSpent?: number;
  totalOrders?: number;
};

const UserDetail = () => {
  const router = useRouter();
  const { id } = router.query;
  const { data: session } = useSession();
  const toast = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editedUser, setEditedUser] = useState<Partial<User>>({});
  const [notes, setNotes] = useState('');
  
  // アクションのdisclosureオブジェクト
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { 
    isOpen: isResetOpen, 
    onOpen: onResetOpen, 
    onClose: onResetClose 
  } = useDisclosure();
  const { 
    isOpen: isEmailOpen, 
    onOpen: onEmailOpen, 
    onClose: onEmailClose 
  } = useDisclosure();
  
  // メール送信用の状態
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [emailType, setEmailType] = useState('info');
  
  const cancelRef = React.useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (session?.user?.isAdmin && id) {
      fetchUser(id as string);
    } else {
      setLoading(false);
    }
  }, [session, id]);

  const fetchUser = async (userId: string) => {
    try {
      setLoading(true);
      
      // 認証ヘッダーを含める
      const adminToken = localStorage.getItem('adminToken');
      
      const response = await axios.get(`/api/admin/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${adminToken}`
        }
      });
      setUser(response.data);
      setIsAdmin(response.data.isAdmin);
      setIsLocked(response.data.isLocked || false);
      setNotes(response.data.notes || '');
      setEditedUser({
        name: response.data.name,
        email: response.data.email,
        discordId: response.data.discordId || '',
      });
    } catch (error) {
      console.error('ユーザー取得エラー:', error);
      toast({
        title: 'エラーが発生しました',
        description: 'ユーザーの取得に失敗しました',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAdminToggle = async () => {
    if (!user) return;
    
    // 自分自身の管理者権限を変更しようとしている場合は阻止
    if (user.id === session?.user?.id) {
      toast({
        title: '権限を変更できません',
        description: '自分自身の管理者権限は変更できません',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    
    try {
      setUpdating(true);
      
      const adminToken = localStorage.getItem('adminToken');
      
      await axios.put(`/api/admin/users/${id}`, 
        { isAdmin: !isAdmin },
        {
          headers: {
            Authorization: `Bearer ${adminToken}`
          }
        }
      );
      
      setIsAdmin(!isAdmin);
      setUser(prev => prev ? { ...prev, isAdmin: !isAdmin } : null);
      
      toast({
        title: '管理者権限を更新しました',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('権限更新エラー:', error);
      toast({
        title: 'エラーが発生しました',
        description: '管理者権限の更新に失敗しました',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleLockToggle = async () => {
    if (!user) return;
    
    try {
      setUpdating(true);
      
      const adminToken = localStorage.getItem('adminToken');
      
      await axios.put(`/api/admin/users/${id}`, 
        { isLocked: !isLocked },
        {
          headers: {
            Authorization: `Bearer ${adminToken}`
          }
        }
      );
      
      setIsLocked(!isLocked);
      setUser(prev => prev ? { ...prev, isLocked: !isLocked } : null);
      
      toast({
        title: isLocked ? 'アカウントのロックを解除しました' : 'アカウントをロックしました',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('アカウントロック更新エラー:', error);
      toast({
        title: 'エラーが発生しました',
        description: 'アカウント状態の更新に失敗しました',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!user) return;
    
    // 自分自身を削除しようとしている場合は阻止
    if (user.id === session?.user?.id) {
      toast({
        title: '削除できません',
        description: '自分自身のアカウントは削除できません',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    
    try {
      const adminToken = localStorage.getItem('adminToken');
      
      await axios.delete(`/api/admin/users/${id}`, {
        headers: {
          Authorization: `Bearer ${adminToken}`
        }
      });
      
      toast({
        title: 'ユーザーを削除しました',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      router.push('/admin/users');
    } catch (error) {
      console.error('ユーザー削除エラー:', error);
      toast({
        title: 'エラーが発生しました',
        description: 'ユーザーの削除に失敗しました',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      onClose();
    }
  };

  const handleResetPassword = async () => {
    if (!user) return;
    
    try {
      setUpdating(true);
      
      const adminToken = localStorage.getItem('adminToken');
      
      await axios.post(`/api/admin/users/${id}/reset-password`, {}, {
        headers: {
          Authorization: `Bearer ${adminToken}`
        }
      });
      
      toast({
        title: 'パスワードリセットメールを送信しました',
        description: `${user.email}宛にパスワードリセット手順が送信されました`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      onResetClose();
    } catch (error) {
      console.error('パスワードリセットエラー:', error);
      toast({
        title: 'エラーが発生しました',
        description: 'パスワードリセットメールの送信に失敗しました',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleSendEmail = async () => {
    if (!user || !emailSubject.trim() || !emailBody.trim()) return;
    
    try {
      setUpdating(true);
      
      const adminToken = localStorage.getItem('adminToken');
      
      await axios.post(`/api/admin/users/${id}/send-email`, {
        subject: emailSubject,
        body: emailBody,
        type: emailType
      }, {
        headers: {
          Authorization: `Bearer ${adminToken}`
        }
      });
      
      toast({
        title: 'メールを送信しました',
        description: `${user.email}宛にメールが送信されました`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      // フォームをリセット
      setEmailSubject('');
      setEmailBody('');
      setEmailType('info');
      
      onEmailClose();
    } catch (error) {
      console.error('メール送信エラー:', error);
      toast({
        title: 'エラーが発生しました',
        description: 'メールの送信に失敗しました',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleEditToggle = () => {
    setEditMode(!editMode);
    if (!editMode) {
      // 編集モードに入る時に現在のデータをセット
      setEditedUser({
        name: user?.name || '',
        email: user?.email || '',
        discordId: user?.discordId || '',
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditedUser({ ...editedUser, [name]: value });
  };

  const handleSaveUser = async () => {
    if (!user || !editedUser.name || !editedUser.email) return;
    
    try {
      setUpdating(true);
      
      const adminToken = localStorage.getItem('adminToken');
      
      await axios.put(`/api/admin/users/${id}`, 
        { 
          ...editedUser,
          notes
        },
        {
          headers: {
            Authorization: `Bearer ${adminToken}`
          }
        }
      );
      
      // ユーザー情報を更新
      setUser(prev => prev ? { 
        ...prev, 
        name: editedUser.name || prev.name,
        email: editedUser.email || prev.email,
        discordId: editedUser.discordId || prev.discordId,
        notes
      } : null);
      
      toast({
        title: 'ユーザー情報を更新しました',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      setEditMode(false);
    } catch (error) {
      console.error('ユーザー更新エラー:', error);
      toast({
        title: 'エラーが発生しました',
        description: 'ユーザー情報の更新に失敗しました',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setUpdating(false);
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

  if (loading) {
    return (
      <AdminLayout>
        <Flex justify="center" align="center" minH="60vh">
          <Spinner size="xl" thickness="4px" speed="0.65s" color="blue.500" />
        </Flex>
      </AdminLayout>
    );
  }

  if (!session?.user?.isAdmin) {
    return (
      <AdminLayout>
        <Container maxW="container.md" py={8}>
          <VStack spacing={6} align="center">
            <Heading>アクセス権限がありません</Heading>
            <Text>このページにアクセスするには管理者権限が必要です</Text>
            <Button 
              colorScheme="blue"
              onClick={() => router.push('/')}
            >
              トップページへ戻る
            </Button>
          </VStack>
        </Container>
      </AdminLayout>
    );
  }

  if (!user) {
    return (
      <AdminLayout>
        <Container maxW="container.md" py={8}>
          <VStack spacing={6} align="center">
            <Heading>ユーザーが見つかりません</Heading>
            <Text>指定されたユーザーが見つかりませんでした</Text>
            <Button 
              colorScheme="blue" 
              leftIcon={<FaArrowLeft />}
              onClick={() => router.push('/admin/users')}
            >
              ユーザー一覧へ戻る
            </Button>
          </VStack>
        </Container>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Container maxW="container.xl" py={8}>
        <VStack spacing={8} align="stretch">
          <HStack justifyContent="space-between">
            <HStack>
              <Button
                leftIcon={<FaArrowLeft />}
                variant="outline"
                onClick={() => router.push('/admin/users')}
              >
                ユーザー一覧に戻る
              </Button>

              <Button
                leftIcon={<FaLock />}
                colorScheme={isLocked ? 'green' : 'red'}
                variant="outline"
                onClick={handleLockToggle}
                isLoading={updating}
              >
                {isLocked ? 'ロック解除' : 'アカウントをロック'}
              </Button>

              <Heading as="h1" size="xl">
                ユーザー詳細
              </Heading>
            </HStack>
            
            <HStack>
              <Tooltip label={editMode ? "編集をキャンセル" : "ユーザー情報を編集"}>
                <Button
                  colorScheme={editMode ? "gray" : "blue"}
                  onClick={handleEditToggle}
                  leftIcon={<FaUserEdit />}
                >
                  {editMode ? "キャンセル" : "編集"}
                </Button>
              </Tooltip>
              
              {editMode && (
                <Button
                  colorScheme="green"
                  onClick={handleSaveUser}
                  isLoading={updating}
                  leftIcon={<FaSave />}
                >
                  保存
                </Button>
              )}
            </HStack>
          </HStack>

          <Tabs variant="enclosed" colorScheme="blue">
            <TabList>
              <Tab>基本情報</Tab>
              <Tab>注文履歴</Tab>
              <Tab>アクション</Tab>
            </TabList>

            <TabPanels>
              {/* 基本情報タブ */}
              <TabPanel>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8}>
                  {/* ユーザー基本情報カード */}
                  <Box p={6} shadow="md" borderWidth="1px" borderRadius="md">
                    <HStack spacing={6} align="flex-start" mb={4}>
                      {user.image && (
                        <Box
                          width="100px"
                          height="100px"
                          borderRadius="full"
                          overflow="hidden"
                          bg="gray.200"
                        >
                          <Image
                            src={user.image}
                            alt={user.name}
                            width="100%"
                            height="100%"
                            objectFit="cover"
                          />
                        </Box>
                      )}
                      <VStack align="start" spacing={1} flex="1">
                        {editMode ? (
                          <FormControl isRequired mb={2}>
                            <FormLabel>名前</FormLabel>
                            <Input
                              name="name"
                              value={editedUser.name || ''}
                              onChange={handleInputChange}
                            />
                          </FormControl>
                        ) : (
                          <Box>
                            <Text fontSize="xs" color="gray.500">
                              名前
                            </Text>
                            <Heading size="md" mb={1}>
                              {user.name} {isLocked && <Badge colorScheme="red">ロック中</Badge>}
                            </Heading>
                          </Box>
                        )}
                        
                        {editMode ? (
                          <FormControl isRequired mb={2}>
                            <FormLabel>メールアドレス</FormLabel>
                            <Input
                              name="email"
                              type="email"
                              value={editedUser.email || ''}
                              onChange={handleInputChange}
                            />
                          </FormControl>
                        ) : (
                          <Box>
                            <Text fontSize="xs" color="gray.500">
                              メールアドレス
                            </Text>
                            <Text>{user.email}</Text>
                          </Box>
                        )}
                        
                        {editMode ? (
                          <FormControl mb={2}>
                            <FormLabel>Discord ID</FormLabel>
                            <Input
                              name="discordId"
                              value={editedUser.discordId || ''}
                              onChange={handleInputChange}
                            />
                          </FormControl>
                        ) : (
                          <Box>
                            <Text fontSize="xs" color="gray.500">
                              Discord ID
                            </Text>
                            <Text>{user.discordId || '未設定'}</Text>
                          </Box>
                        )}
                      </VStack>
                    </HStack>

                    <Divider my={4} />
                    
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                      <Box>
                        <Text fontSize="xs" color="gray.500">
                          ユーザーID
                        </Text>
                        <Text fontFamily="monospace">{user._id}</Text>
                      </Box>
                      
                      <Box>
                        <Text fontSize="xs" color="gray.500">
                          登録日
                        </Text>
                        <HStack>
                          <FaCalendar />
                          <Text>{new Date(user.createdAt).toLocaleDateString()}</Text>
                        </HStack>
                      </Box>
                      
                      <Box>
                        <Text fontSize="xs" color="gray.500">
                          最終ログイン
                        </Text>
                        <HStack>
                          <FaSignInAlt />
                          <Text>{new Date(user.lastLogin).toLocaleDateString()}</Text>
                        </HStack>
                      </Box>
                      
                      <Box>
                        <Text fontSize="xs" color="gray.500">
                          管理者権限
                        </Text>
                        <HStack>
                          <Switch
                            isChecked={isAdmin}
                            onChange={handleAdminToggle}
                            isDisabled={user.id === session?.user?.id || updating}
                            colorScheme="teal"
                          />
                          <Text>{isAdmin ? '有効' : '無効'}</Text>
                        </HStack>
                      </Box>
                    </SimpleGrid>
                  </Box>

                  {/* 統計・メモカード */}
                  <Box p={6} shadow="md" borderWidth="1px" borderRadius="md">
                    <Heading size="md" mb={4}>統計情報</Heading>
                    
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mb={6}>
                      <Stat>
                        <StatLabel>総注文数</StatLabel>
                        <StatNumber>{user.totalOrders || 0}</StatNumber>
                        <StatHelpText>
                          <FaShoppingCart /> これまでの注文数
                        </StatHelpText>
                      </Stat>
                      
                      <Stat>
                        <StatLabel>合計購入金額</StatLabel>
                        <StatNumber>¥{user.totalSpent?.toLocaleString() || 0}</StatNumber>
                        <StatHelpText>
                          <FaShoppingCart /> 累計購入額
                        </StatHelpText>
                      </Stat>
                    </SimpleGrid>
                    
                    <Divider my={4} />
                    
                    <Heading size="md" mb={4}>管理者メモ</Heading>
                    <FormControl>
                      <Textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="このユーザーに関するメモ"
                        rows={5}
                        resize="vertical"
                        isDisabled={!editMode && !user.notes}
                      />
                      {!editMode && (
                        <FormHelperText>
                          編集モードでメモを追加できます
                        </FormHelperText>
                      )}
                    </FormControl>
                  </Box>
                </SimpleGrid>
              </TabPanel>

              {/* 注文履歴タブ */}
              <TabPanel>
                <Box p={6} shadow="md" borderWidth="1px" borderRadius="md">
                  <Heading size="md" mb={4}>注文履歴</Heading>
                  
                  {user.orders && user.orders.length > 0 ? (
                    <Box overflowX="auto">
                      <Table variant="simple">
                        <Thead>
                          <Tr>
                            <Th>注文ID</Th>
                            <Th>日付</Th>
                            <Th>金額</Th>
                            <Th>状態</Th>
                            <Th>アクション</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {user.orders.map((order) => (
                            <Tr key={order._id}>
                              <Td fontFamily="monospace">{order._id}</Td>
                              <Td>{new Date(order.createdAt).toLocaleDateString()}</Td>
                              <Td>¥{order.total.toLocaleString()}</Td>
                              <Td>{getStatusBadge(order.status)}</Td>
                              <Td>
                                <Button
                                  size="sm"
                                  colorScheme="blue"
                                  variant="outline"
                                  onClick={() => router.push(`/admin/orders/${order._id}`)}
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
                    <Text color="gray.500" textAlign="center" py={4}>
                      注文履歴がありません
                    </Text>
                  )}
                </Box>
              </TabPanel>

              {/* アクションタブ */}
              <TabPanel>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                  <Box p={6} shadow="md" borderWidth="1px" borderRadius="md">
                    <Heading size="md" mb={4}>アカウント管理</Heading>
                    
                    <VStack spacing={4} align="stretch">
                      <Button 
                        leftIcon={<FaKey />} 
                        colorScheme="blue" 
                        onClick={onResetOpen}
                        isDisabled={updating}
                      >
                        パスワードリセット
                      </Button>
                      
                      <Button 
                        leftIcon={<FaEnvelope />} 
                        colorScheme="purple" 
                        onClick={onEmailOpen}
                        isDisabled={updating}
                      >
                        メールを送信
                      </Button>
                      
                      <Button 
                        leftIcon={<FaUserSlash />} 
                        colorScheme="red" 
                        onClick={onOpen}
                        isDisabled={updating || user.id === session?.user?.id}
                      >
                        ユーザーを削除
                      </Button>
                    </VStack>
                  </Box>
                  
                  <Box p={6} shadow="md" borderWidth="1px" borderRadius="md">
                    <Heading size="md" mb={4}>アクティビティログ</Heading>
                    
                    <Text color="gray.500" textAlign="center" py={4}>
                      ログデータは現在実装されていません
                    </Text>
                  </Box>
                </SimpleGrid>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </VStack>
      </Container>
      
      {/* 削除確認ダイアログ */}
      <AlertDialog
        isOpen={isOpen}
        leastDestructiveRef={cancelRef}
        onClose={onClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              ユーザーを削除
            </AlertDialogHeader>

            <AlertDialogBody>
              このユーザーを削除してもよろしいですか？この操作は元に戻せません。
              ユーザーの注文履歴や購入データも削除されます。
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose}>
                キャンセル
              </Button>
              <Button colorScheme="red" onClick={handleDeleteUser} ml={3}>
                削除する
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
      
      {/* パスワードリセット確認ダイアログ */}
      <AlertDialog
        isOpen={isResetOpen}
        leastDestructiveRef={cancelRef}
        onClose={onResetClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              パスワードリセット
            </AlertDialogHeader>

            <AlertDialogBody>
              {user.email}宛にパスワードリセットリンクを送信しますか？
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onResetClose}>
                キャンセル
              </Button>
              <Button colorScheme="blue" onClick={handleResetPassword} ml={3} isLoading={updating}>
                送信する
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
      
      {/* メール送信モーダル */}
      <AlertDialog
        isOpen={isEmailOpen}
        leastDestructiveRef={cancelRef}
        onClose={onEmailClose}
        size="xl"
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              {user.name}さんにメールを送信
            </AlertDialogHeader>

            <AlertDialogBody>
              <VStack spacing={4} align="stretch">
                <FormControl isRequired>
                  <FormLabel>メールタイプ</FormLabel>
                  <RadioGroup value={emailType} onChange={setEmailType}>
                    <Stack direction="row">
                      <Radio value="info" colorScheme="blue">お知らせ</Radio>
                      <Radio value="warning" colorScheme="orange">警告</Radio>
                      <Radio value="support" colorScheme="green">サポート</Radio>
                    </Stack>
                  </RadioGroup>
                </FormControl>
                
                <FormControl isRequired>
                  <FormLabel>件名</FormLabel>
                  <Input
                    placeholder="メールの件名"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                  />
                </FormControl>
                
                <FormControl isRequired>
                  <FormLabel>本文</FormLabel>
                  <Textarea
                    placeholder="メールの本文"
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    minHeight="200px"
                  />
                </FormControl>
              </VStack>
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onEmailClose}>
                キャンセル
              </Button>
              <Button 
                colorScheme="blue" 
                onClick={handleSendEmail} 
                ml={3} 
                isLoading={updating}
                isDisabled={!emailSubject.trim() || !emailBody.trim()}
              >
                送信する
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </AdminLayout>
  );
};

export default UserDetail; 