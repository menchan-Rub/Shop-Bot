import React, { useState, useEffect } from 'react';
import {
  Box, Container, Heading, Text, Button, VStack,
  HStack, Table, Thead, Tbody, Tr, Th, Td,
  useToast, Spinner, Flex, Badge, Switch,
  InputGroup, InputLeftElement, Input, useDisclosure,
  AlertDialog, AlertDialogOverlay, AlertDialogContent,
  AlertDialogHeader, AlertDialogBody, AlertDialogFooter,
  Modal, ModalOverlay, ModalContent, ModalHeader,
  ModalFooter, ModalBody, ModalCloseButton, FormControl,
  FormLabel, FormErrorMessage, Checkbox
} from '@chakra-ui/react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { FaSearch, FaSort, FaEye, FaTrash, FaPlus, FaUser, FaEnvelope, FaUserPlus } from 'react-icons/fa';
import AdminLayout from '../../../components/admin/AdminLayout';
import { getWithAuth, postWithAuth, putWithAuth, deleteWithAuth } from '../../../lib/api';
import { useRouter } from 'next/router';

type User = {
  _id: string;
  id: string;
  name: string;
  email: string;
  image: string;
  isAdmin: boolean;
  createdAt: string;
  lastLogin: string;
};

const UsersManagement = () => {
  const { data: session } = useSession();
  const toast = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = React.useRef<HTMLButtonElement>(null);
  
  // ユーザー追加モーダル用
  const { 
    isOpen: isAddUserOpen, 
    onOpen: onAddUserOpen, 
    onClose: onAddUserClose 
  } = useDisclosure();
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    isAdmin: false
  });
  const [formErrors, setFormErrors] = useState({
    name: '',
    email: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (session?.user?.isAdmin) {
      fetchUsers();
    } else {
      setLoading(false);
    }
  }, [session, sortField, sortOrder]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      try {
        // API関数を使用
        const data = await getWithAuth(`/api/admin/users?sort=${sortField}&order=${sortOrder}`);
        setUsers(data);
      } catch (error) {
        console.error('ユーザー取得エラー:', error);
        
        // APIリクエストが失敗した場合はデモデータを使用（すでにデモデータは返される）
        toast({
          title: 'デモモードで表示中',
          description: 'APIサーバーに接続できないため、デモデータを表示しています',
          status: 'info',
          duration: 5000,
          isClosable: true,
        });
      }
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

  const handleAdminToggle = async (userId: string, isCurrentlyAdmin: boolean) => {
    try {
      try {
        // API関数を使用
        await putWithAuth(`/api/admin/users/${userId}`, { isAdmin: !isCurrentlyAdmin });
        
        // 状態更新
        setUsers(users.map(user => 
          user._id === userId ? { ...user, isAdmin: !isCurrentlyAdmin } : user
        ));
        
        toast({
          title: '管理者権限を更新しました',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } catch (error) {
        console.error('権限更新エラー:', error);
        
        // エラー時もUI上で権限を切り替え（デモモード）
        setUsers(users.map(user => 
          user._id === userId ? { ...user, isAdmin: !isCurrentlyAdmin } : user
        ));
        
        toast({
          title: 'デモモードで管理者権限を更新しました',
          description: 'APIサーバーに接続できないため、UI上でのみ更新しています',
          status: 'info',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error: any) {
      console.error('権限更新エラー:', error);
      toast({
        title: 'エラーが発生しました',
        description: error.response?.data?.message || '管理者権限の更新に失敗しました',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleDeleteClick = (userId: string) => {
    setUserToDelete(userId);
    onOpen();
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;

    try {
      try {
        // API関数を使用
        await deleteWithAuth(`/api/admin/users/${userToDelete}`);
        
        // ユーザーリストから削除
        setUsers(users.filter(user => user._id !== userToDelete));
        
        toast({
          title: 'ユーザーを削除しました',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } catch (error) {
        console.error('ユーザー削除エラー:', error);
        
        // エラー時もUIからユーザーを削除（デモモード）
        setUsers(users.filter(user => user._id !== userToDelete));
        
        toast({
          title: 'デモモードでユーザーを削除しました',
          description: 'APIサーバーに接続できないため、UIのみで削除しています',
          status: 'info',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error: any) {
      console.error('ユーザー削除エラー:', error);
      toast({
        title: 'エラーが発生しました',
        description: error.response?.data?.message || 'ユーザーの削除に失敗しました',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setUserToDelete(null);
      onClose();
    }
  };
  
  // 新規ユーザーフォーム関連の処理
  const handleNewUserChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setNewUser({
      ...newUser,
      [name]: type === 'checkbox' ? checked : value
    });
    
    // フォームエラーをクリア
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors({
        ...formErrors,
        [name]: ''
      });
    }
  };
  
  const validateForm = (): boolean => {
    const errors = {
      name: '',
      email: ''
    };
    let isValid = true;
    
    if (!newUser.name.trim()) {
      errors.name = '名前を入力してください';
      isValid = false;
    }
    
    if (!newUser.email.trim()) {
      errors.email = 'メールアドレスを入力してください';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(newUser.email)) {
      errors.email = '有効なメールアドレスを入力してください';
      isValid = false;
    }
    
    setFormErrors(errors);
    return isValid;
  };
  
  const handleAddUser = async () => {
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      try {
        // API関数を使用
        const data = await postWithAuth('/api/admin/users', newUser);
        
        // 新しいユーザーを追加
        setUsers([data, ...users]);
        
        toast({
          title: 'ユーザーを追加しました',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } catch (error) {
        console.error('ユーザー追加エラー:', error);
        
        // エラー時はデモデータを作成
        const newDemoUser = {
          _id: `new_${Date.now()}`,
          id: `new_${Date.now()}`,
          name: newUser.name,
          email: newUser.email,
          image: `https://i.pravatar.cc/150?u=${newUser.email}`,
          isAdmin: newUser.isAdmin,
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString()
        };
        
        // デモユーザーを追加
        setUsers([newDemoUser, ...users]);
        
        toast({
          title: 'デモユーザーを追加しました',
          description: 'APIサーバーに接続できないため、デモモードで追加しています',
          status: 'info',
          duration: 5000,
          isClosable: true,
        });
      }
      
      // フォームをリセット
      setNewUser({
        name: '',
        email: '',
        isAdmin: false
      });
      
      // モーダルを閉じる
      onAddUserClose();
    } catch (error: any) {
      console.error('ユーザー追加エラー:', error);
      toast({
        title: 'エラーが発生しました',
        description: error.response?.data?.message || 'ユーザーの追加に失敗しました',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // フィルタリングされたユーザー
  const filteredUsers = users.filter(user => {
    const nameMatch = user.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const emailMatch = user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return (nameMatch || emailMatch);
  });

  if (loading) {
    return (
      <AdminLayout>
        <Flex justify="center" align="center" minH="60vh">
          <Spinner size="xl" thickness="4px" speed="0.65s" color="blue.500" />
        </Flex>
      </AdminLayout>
    );
  }

  // 管理者権限チェック - sessionとlocalStorageの両方をチェック
  const adminToken = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
  const hasAdminPermission = session?.user?.isAdmin || !!adminToken;

  if (!hasAdminPermission) {
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

  return (
    <AdminLayout>
      <Container maxW="container.xl" py={8}>
        <VStack spacing={8} align="stretch">
          <Box>
            <Heading as="h1" size="2xl" mb={4}>
              ユーザー管理
            </Heading>
            <Text color="gray.500" mb={4}>
              ユーザーの確認と管理を行います
            </Text>

            <HStack mb={6} justifyContent="space-between">
              <HStack spacing={3}>
                <Button
                  colorScheme="cyan"
                  leftIcon={<FaUserPlus />}
                  size="md"
                  fontWeight="bold"
                  boxShadow="sm"
                  _hover={{ transform: 'translateY(-2px)', boxShadow: 'md' }}
                  transition="all 0.2s"
                  onClick={onAddUserOpen}
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
              
              <InputGroup maxW="300px">
                <InputLeftElement pointerEvents="none">
                  <FaSearch color="gray.300" />
                </InputLeftElement>
                <Input
                  placeholder="ユーザーを検索..."
                  value={searchTerm}
                  onChange={handleSearch}
                />
              </InputGroup>
            </HStack>
          </Box>

          <Box overflowX="auto">
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>
                    <HStack spacing={1} cursor="pointer" onClick={() => handleSortChange('name')}>
                      <Text>名前</Text>
                      <FaSort size="12px" />
                    </HStack>
                  </Th>
                  <Th>メールアドレス</Th>
                  <Th>
                    <HStack spacing={1} cursor="pointer" onClick={() => handleSortChange('createdAt')}>
                      <Text>登録日</Text>
                      <FaSort size="12px" />
                    </HStack>
                  </Th>
                  <Th>管理者権限</Th>
                  <Th>操作</Th>
                </Tr>
              </Thead>
              <Tbody>
                {filteredUsers.map((user) => (
                  <Tr key={user._id}>
                    <Td fontWeight="medium">
                      <HStack>
                        {user.image && (
                          <Box
                            width="30px"
                            height="30px"
                            borderRadius="full"
                            overflow="hidden"
                            mr={2}
                          >
                            <img src={user.image} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </Box>
                        )}
                        <Text>{user.name}</Text>
                      </HStack>
                    </Td>
                    <Td>{user.email}</Td>
                    <Td>{new Date(user.createdAt).toLocaleDateString()}</Td>
                    <Td>
                      <Switch
                        isChecked={user.isAdmin}
                        onChange={() => handleAdminToggle(user._id, user.isAdmin)}
                        colorScheme="teal"
                      />
                    </Td>
                    <Td>
                      <HStack spacing={2}>
                        <Button
                          size="sm"
                          colorScheme="red"
                          variant="outline"
                          onClick={() => handleDeleteClick(user._id)}
                          leftIcon={<FaTrash />}
                        >
                          削除
                        </Button>
                      </HStack>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
        </VStack>
      </Container>
      
      {/* ユーザー削除確認ダイアログ */}
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
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose}>
                キャンセル
              </Button>
              <Button colorScheme="red" onClick={handleDeleteConfirm} ml={3}>
                削除
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
      
      {/* ユーザー追加モーダル */}
      <Modal isOpen={isAddUserOpen} onClose={onAddUserClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>新規ユーザーを追加</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <FormControl isRequired isInvalid={!!formErrors.name} mb={4}>
              <FormLabel>名前</FormLabel>
              <InputGroup>
                <InputLeftElement pointerEvents="none">
                  <FaUser color="gray.300" />
                </InputLeftElement>
                <Input
                  name="name"
                  placeholder="ユーザー名"
                  value={newUser.name}
                  onChange={handleNewUserChange}
                />
              </InputGroup>
              <FormErrorMessage>{formErrors.name}</FormErrorMessage>
            </FormControl>

            <FormControl isRequired isInvalid={!!formErrors.email} mb={4}>
              <FormLabel>メールアドレス</FormLabel>
              <InputGroup>
                <InputLeftElement pointerEvents="none">
                  <FaEnvelope color="gray.300" />
                </InputLeftElement>
                <Input
                  name="email"
                  type="email"
                  placeholder="user@example.com"
                  value={newUser.email}
                  onChange={handleNewUserChange}
                />
              </InputGroup>
              <FormErrorMessage>{formErrors.email}</FormErrorMessage>
            </FormControl>

            <FormControl>
              <Checkbox
                name="isAdmin"
                isChecked={newUser.isAdmin}
                onChange={handleNewUserChange}
                colorScheme="teal"
              >
                管理者権限を付与
              </Checkbox>
            </FormControl>
          </ModalBody>

          <ModalFooter>
            <Button 
              colorScheme="teal" 
              mr={3} 
              onClick={handleAddUser}
              isLoading={isSubmitting}
            >
              追加
            </Button>
            <Button onClick={onAddUserClose}>キャンセル</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </AdminLayout>
  );
};

export default UsersManagement; 