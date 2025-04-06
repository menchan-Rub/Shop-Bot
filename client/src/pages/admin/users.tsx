import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Button,
  HStack,
  VStack,
  Text,
  Badge,
  useToast,
  Input,
  InputGroup,
  InputLeftElement,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Flex,
  Spinner,
  Alert,
  AlertIcon,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Switch,
  Center,
  AlertTitle,
  AlertDescription,
  Icon,
} from '@chakra-ui/react';
import { SearchIcon, ChevronDownIcon } from '@chakra-ui/icons';
import { FaUserPlus, FaEdit, FaLock, FaTrash, FaEllipsisV, FaExclamationCircle } from 'react-icons/fa';
import axios from 'axios';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useSession } from 'next-auth/react';
import AdminLayout from '../../components/admin/AdminLayout';

// ユーザータイプの定義
interface User {
  id: string;
  username: string;
  email: string;
  createdAt: string;
  lastLogin?: string;
  isAdmin: boolean;
  isStaff: boolean;
  emailVerified?: boolean;
  status: 'active' | 'suspended' | 'banned';
  points: number;
}

// ユーザーフォーム用の型
interface UserFormData {
  isAdmin: boolean;
  isStaff: boolean;
  status: 'active' | 'suspended' | 'banned';
  points: number;
}

const UsersManagement = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const toast = useToast();
  const { isOpen: isModalOpen, onOpen: onModalOpen, onClose: onModalClose } = useDisclosure();
  const { isOpen: isNewUserModalOpen, onOpen: onNewUserModalOpen, onClose: onNewUserModalClose } = useDisclosure();
  
  // ユーザーリスト
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 選択されたユーザー（編集/削除用）
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // 編集フォームの状態
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [userForm, setUserForm] = useState<UserFormData>({
    isAdmin: false,
    isStaff: false,
    status: 'active',
    points: 0
  });

  const [hasAdminAccess, setHasAdminAccess] = useState(false);

  // ユーザーリストを取得
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
      fetchUsers();
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

  // ユーザーリストを取得
  const fetchUsers = async () => {
    try {
      // adminTokenがない場合でもデモデータで続行する
      const adminToken = localStorage.getItem('adminToken');
      
      console.log('APIリクエスト送信先：', '/api/admin/users');
      
      // APIにリクエスト送信 - 環境変数を使わず直接パスを指定
      const response = await axios.get(
        '/api/admin/users',  // 相対パスで指定してNext.jsのAPIルートを使用
        {
          headers: adminToken ? {
            Authorization: `Bearer ${adminToken}`
          } : {}
        }
      );

      setUsers(response.data);
      setFilteredUsers(response.data);
      // エラーメッセージをクリア
      setError('');
    } catch (error) {
      console.error('ユーザーリスト取得エラー:', error);
      
      // エラー表示
      setError('ユーザーリストの取得に失敗しました');
      
      // デモデータを表示するためのフォールバック
      const demoUsers = [
        {
          id: '1',
          username: 'admin',
          email: 'admin@example.com',
          createdAt: '2023-04-01T09:00:00.000Z',
          lastLogin: '2023-04-05T12:30:45.000Z',
          isAdmin: true,
          isStaff: true,
          emailVerified: true,
          status: 'active',
          points: 1000
        },
        {
          id: '2',
          username: 'staff_user',
          email: 'staff@example.com',
          createdAt: '2023-04-02T10:15:00.000Z',
          lastLogin: '2023-04-04T08:20:10.000Z',
          isAdmin: false,
          isStaff: true,
          emailVerified: true,
          status: 'active',
          points: 500
        },
        {
          id: '3',
          username: 'regular_user',
          email: 'user@example.com',
          createdAt: '2023-04-03T14:30:00.000Z',
          lastLogin: '2023-04-03T18:45:20.000Z',
          isAdmin: false,
          isStaff: false,
          emailVerified: true,
          status: 'active',
          points: 250
        },
        {
          id: '4',
          username: 'suspended_user',
          email: 'suspended@example.com',
          createdAt: '2023-03-15T11:20:00.000Z',
          lastLogin: '2023-03-28T09:10:30.000Z',
          isAdmin: false,
          isStaff: false,
          emailVerified: true,
          status: 'suspended',
          points: 100
        },
        {
          id: '5',
          username: 'banned_user',
          email: 'banned@example.com',
          createdAt: '2023-02-10T15:45:00.000Z',
          lastLogin: '2023-02-28T16:30:40.000Z',
          isAdmin: false,
          isStaff: false,
          emailVerified: false,
          status: 'banned',
          points: 0
        }
      ];
      
      // エラー時はデモデータを使用
      setUsers(demoUsers);
      setFilteredUsers(demoUsers);
    } finally {
      setIsLoading(false);
    }
  };

  // 検索機能
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredUsers(users);
    } else {
      const lowercaseQuery = searchQuery.toLowerCase();
      const filtered = users.filter(
        user =>
          user.username.toLowerCase().includes(lowercaseQuery) ||
          user.email.toLowerCase().includes(lowercaseQuery)
      );
      setFilteredUsers(filtered);
    }
  }, [searchQuery, users]);

  // ユーザー編集モーダルを開く
  const handleEditUser = (user: User) => {
    console.log('ユーザー編集モーダルを開きます:', user);
    
    // まず選択したユーザーとフォームをリセット
    setSelectedUser(null);
    setUserForm({
      isAdmin: false,
      isStaff: false,
      status: 'active',
      points: 0
    });
    
    // 少し遅延させてから選択したユーザーを設定
    setTimeout(() => {
      setSelectedUser(user);
      
      // フォームの初期値を設定
      setUserForm({
        isAdmin: user.isAdmin || false,
        isStaff: user.isStaff || false,
        status: user.status || 'active',
        points: user.points || 0
      });
      
      // モーダルを開く
      onModalOpen();
    }, 10);
  };

  // ユーザー更新
  const handleUpdateUser = async () => {
    if (!selectedUser) return;
    
    setIsUpdating(true);
    
    try {
      const adminToken = localStorage.getItem('adminToken');
      
      const response = await axios.put(
        `/api/admin/users/${selectedUser.id}`,  // 相対パスで指定
        userForm,
        {
          headers: {
            Authorization: `Bearer ${adminToken}`
          }
        }
      );
      
      // ユーザーリストを更新
      setUsers(prevUsers =>
        prevUsers.map(user => 
          user.id === selectedUser.id ? { ...user, ...userForm } : user
        )
      );
      
      toast({
        title: 'ユーザー更新',
        description: 'ユーザー情報が更新されました',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      onModalClose();
    } catch (error) {
      console.error('ユーザー更新エラー:', error);
      toast({
        title: 'エラー',
        description: 'ユーザー情報の更新に失敗しました',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsUpdating(false);
    }
  };
  
  // ユーザーのステータスを変更
  const handleStatusChange = async (userId: string, newStatus: 'active' | 'suspended' | 'banned') => {
    try {
      const adminToken = localStorage.getItem('adminToken');
      
      await axios.put(
        `/api/admin/users/${userId}/status`,  // 相対パスで指定
        { status: newStatus },
        {
          headers: {
            Authorization: `Bearer ${adminToken}`
          }
        }
      );
      
      // ユーザーリストを更新
      setUsers(prevUsers =>
        prevUsers.map(user => 
          user.id === userId ? { ...user, status: newStatus } : user
        )
      );
      
      toast({
        title: 'ステータス変更',
        description: `ユーザーのステータスが ${newStatus} に変更されました`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('ステータス変更エラー:', error);
      toast({
        title: 'エラー',
        description: 'ステータスの変更に失敗しました',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };
  
  // パスワードリセット
  const handlePasswordReset = async (userId: string, email: string) => {
    try {
      const adminToken = localStorage.getItem('adminToken');
      
      await axios.post(
        `/api/admin/users/${userId}/reset-password`,  // 相対パスで指定
        {},
        {
          headers: {
            Authorization: `Bearer ${adminToken}`
          }
        }
      );
      
      toast({
        title: 'パスワードリセット',
        description: `パスワードリセットのメールが ${email} に送信されました`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('パスワードリセットエラー:', error);
      toast({
        title: 'エラー',
        description: 'パスワードリセットに失敗しました',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };
  
  // ユーザー削除
  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('本当にこのユーザーを削除しますか？この操作は取り消せません。')) {
      return;
    }
    
    try {
      const adminToken = localStorage.getItem('adminToken');
      
      await axios.delete(
        `/api/admin/users/${userId}`,  // 相対パスで指定
        {
          headers: {
            Authorization: `Bearer ${adminToken}`
          }
        }
      );
      
      // ユーザーリストから削除
      setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
      
      toast({
        title: 'ユーザー削除',
        description: 'ユーザーが削除されました',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('ユーザー削除エラー:', error);
      toast({
        title: 'エラー',
        description: 'ユーザーの削除に失敗しました',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // 日付のフォーマット
  const formatDate = (dateString?: string) => {
    if (!dateString) return '未ログイン';
    return new Date(dateString).toLocaleString('ja-JP');
  };
  
  // ステータスに応じたバッジの色を取得
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'green';
      case 'suspended':
        return 'yellow';
      case 'banned':
        return 'red';
      default:
        return 'gray';
    }
  };
  
  // ステータスの日本語表示
  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'アクティブ';
      case 'suspended':
        return '一時停止';
      case 'banned':
        return 'BAN';
      default:
        return '不明';
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <Container maxW="container.md" py={8}>
          <VStack spacing={6} align="center">
            <Spinner size="xl" color="cyan.500" thickness="4px" speed="0.65s" />
            <Text mt={4}>ユーザーデータを読み込み中...</Text>
          </VStack>
        </Container>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <Container maxW="container.xl" py={6}>
          <Alert status="error">
            <AlertIcon />
            {error}
          </Alert>
        </Container>
      </AdminLayout>
    );
  }

  // ログイン権限チェック
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
      <Head>
        <title>ユーザー管理 | 管理者パネル</title>
      </Head>
      
      <Container maxW="8xl" py={8}>
        {isLoading ? (
          <Center h="400px">
            <VStack>
              <Spinner size="xl" color="cyan.500" thickness="4px" speed="0.65s" />
              <Text mt={4}>ユーザーデータを読み込み中...</Text>
            </VStack>
          </Center>
        ) : (
          <VStack align="stretch" spacing={6}>
            {/* エラーメッセージがあれば表示 */}
            {error && (
              <Alert status="error" mb={4} rounded="md">
                <AlertIcon />
                <AlertTitle mr={2}>{error}</AlertTitle>
                <AlertDescription>デモデータを表示しています</AlertDescription>
              </Alert>
            )}

            <HStack justifyContent="space-between">
              <VStack align="start" spacing={1}>
                <Heading size="lg">ユーザー管理</Heading>
                <Text color="gray.500">
                  全 {users ? users.length : 0} ユーザー中 {filteredUsers ? filteredUsers.length : 0} 件表示
                </Text>
              </VStack>
              
              <HStack spacing={3}>
                <Button
                  colorScheme="cyan"
                  leftIcon={<FaUserPlus />}
                  size="md"
                  fontWeight="bold"
                  boxShadow="sm"
                  _hover={{ transform: 'translateY(-2px)', boxShadow: 'md' }}
                  transition="all 0.2s"
                  onClick={onNewUserModalOpen}
                >
                  新規ユーザー
                </Button>
                <Button
                  variant="outline"
                  colorScheme="cyan"
                  size="md"
                  onClick={() => router.push('/admin')}
                >
                  ダッシュボードへ戻る
                </Button>
              </HStack>
            </HStack>
            
            {/* 検索ボックス */}
            <InputGroup maxW="md">
              <InputLeftElement pointerEvents="none">
                <SearchIcon color="gray.300" />
              </InputLeftElement>
              <Input
                placeholder="ユーザー名またはメールで検索"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </InputGroup>
            
            {/* ユーザーリスト */}
            {filteredUsers && filteredUsers.length > 0 ? (
              <Box overflowX="auto">
                <Table variant="simple">
                  <Thead>
                    <Tr>
                      <Th>ユーザー名</Th>
                      <Th>メール</Th>
                      <Th>ステータス</Th>
                      <Th>権限</Th>
                      <Th>ポイント</Th>
                      <Th>登録日</Th>
                      <Th>最終ログイン</Th>
                      <Th width="100px">操作</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {filteredUsers.map((user) => (
                      <Tr key={user.id}>
                        <Td fontWeight="medium">{user.username || 'ユーザー名なし'}</Td>
                        <Td>{user.email || '-'}</Td>
                        <Td>
                          <Badge colorScheme={getStatusColor(user.status)}>
                            {getStatusText(user.status)}
                          </Badge>
                        </Td>
                        <Td>
                          <HStack spacing={1}>
                            {user.isAdmin && (
                              <Badge colorScheme="purple">管理者</Badge>
                            )}
                            {user.isStaff && !user.isAdmin && (
                              <Badge colorScheme="blue">スタッフ</Badge>
                            )}
                            {!user.isAdmin && !user.isStaff && (
                              <Badge>一般</Badge>
                            )}
                          </HStack>
                        </Td>
                        <Td>{user.points !== undefined ? user.points : 0}</Td>
                        <Td>{user.createdAt ? formatDate(user.createdAt) : '-'}</Td>
                        <Td>{user.lastLogin ? formatDate(user.lastLogin) : '-'}</Td>
                        <Td>
                          <Menu>
                            <MenuButton
                              as={Button}
                              variant="ghost"
                              size="sm"
                              rightIcon={<FaEllipsisV />}
                            >
                              操作
                            </MenuButton>
                            <MenuList>
                              <MenuItem 
                                icon={<FaEdit />} 
                                onClick={() => handleEditUser(user)}
                              >
                                編集する
                              </MenuItem>
                              <MenuItem 
                                icon={<FaLock />} 
                                onClick={() => handlePasswordReset(user.id, user.email)}
                              >
                                パスワードリセット
                              </MenuItem>
                              <MenuItem 
                                icon={<FaTrash />}
                                color="red.500"
                                onClick={() => handleDeleteUser(user.id)}
                              >
                                削除する
                              </MenuItem>
                            </MenuList>
                          </Menu>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Box>
            ) : (
              <Box p={8} textAlign="center">
                <Icon as={FaExclamationCircle} w={10} h={10} color="gray.400" />
                <Text mt={4} fontSize="lg" color="gray.500">ユーザーが見つかりませんでした</Text>
                {searchQuery && (
                  <Button 
                    mt={4} 
                    size="sm" 
                    onClick={() => setSearchQuery('')}
                  >
                    検索をクリア
                  </Button>
                )}
              </Box>
            )}
          </VStack>
        )}
      </Container>
      
      {/* ユーザー編集モーダル */}
      <Modal isOpen={isModalOpen} onClose={onModalClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>ユーザー編集</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedUser ? (
              <VStack spacing={4} align="stretch">
                <Box>
                  <Text fontWeight="bold">ユーザー名</Text>
                  <Text>{selectedUser.username}</Text>
                </Box>
                
                <Box>
                  <Text fontWeight="bold">メールアドレス</Text>
                  <Text>{selectedUser.email}</Text>
                </Box>
                
                <FormControl>
                  <FormLabel>ポイント</FormLabel>
                  <Input
                    type="number"
                    value={userForm.points}
                    onChange={(e) => setUserForm({ ...userForm, points: parseInt(e.target.value) || 0 })}
                  />
                </FormControl>
                
                <FormControl>
                  <FormLabel>ステータス</FormLabel>
                  <select
                    value={userForm.status}
                    onChange={(e) => setUserForm({ 
                      ...userForm, 
                      status: e.target.value as 'active' | 'suspended' | 'banned' 
                    })}
                    style={{ width: '100%', padding: '8px', borderRadius: '4px', borderColor: '#E2E8F0' }}
                  >
                    <option value="active">アクティブ</option>
                    <option value="suspended">一時停止</option>
                    <option value="banned">BAN</option>
                  </select>
                </FormControl>
                
                <FormControl display="flex" alignItems="center">
                  <FormLabel htmlFor="is-admin" mb="0">
                    管理者
                  </FormLabel>
                  <Switch
                    id="is-admin"
                    isChecked={userForm.isAdmin}
                    onChange={(e) => setUserForm({ ...userForm, isAdmin: e.target.checked })}
                  />
                </FormControl>
                
                <FormControl display="flex" alignItems="center">
                  <FormLabel htmlFor="is-staff" mb="0">
                    スタッフ
                  </FormLabel>
                  <Switch
                    id="is-staff"
                    isChecked={userForm.isStaff}
                    onChange={(e) => setUserForm({ ...userForm, isStaff: e.target.checked })}
                  />
                </FormControl>
              </VStack>
            ) : (
              <Center py={6}>
                <Spinner size="lg" color="blue.500" mr={3} />
                <Text>ユーザー情報を読み込み中...</Text>
              </Center>
            )}
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onModalClose}>
              キャンセル
            </Button>
            <Button 
              colorScheme="blue" 
              onClick={handleUpdateUser}
              isLoading={isUpdating}
              isDisabled={!selectedUser}
            >
              保存
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      
      {/* 新規ユーザーモーダル */}
      <Modal isOpen={isNewUserModalOpen} onClose={onNewUserModalClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>新規ユーザー作成</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>新規ユーザー作成機能は実装中です。デモデータを使用してください。</Text>
          </ModalBody>
          <ModalFooter>
            <Button onClick={onNewUserModalClose}>閉じる</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </AdminLayout>
  );
};

export default UsersManagement; 