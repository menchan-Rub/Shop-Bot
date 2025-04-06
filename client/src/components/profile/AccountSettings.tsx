import React, { useState } from 'react';
import {
  VStack, Heading, Button, ButtonGroup, Box, Text,
  Alert, AlertIcon, AlertDialog, AlertDialogBody,
  AlertDialogFooter, AlertDialogHeader, AlertDialogContent,
  AlertDialogOverlay, useDisclosure, useToast, Divider,
  HStack, Modal, ModalOverlay, ModalContent, ModalHeader,
  ModalFooter, ModalBody, ModalCloseButton, FormControl,
  FormLabel, Input, FormErrorMessage
} from '@chakra-ui/react';
import axios from 'axios';
import { useSession, signOut } from 'next-auth/react';
import { FaDownload, FaTrash, FaSignOutAlt } from 'react-icons/fa';
import { useRouter } from 'next/router';

export default function AccountSettings() {
  const { data: session } = useSession();
  const toast = useToast();
  const router = useRouter();
  const cancelRef = React.useRef<HTMLButtonElement>(null);
  
  // アラートダイアログの状態
  const { 
    isOpen: isDeleteAlertOpen, 
    onOpen: onDeleteAlertOpen, 
    onClose: onDeleteAlertClose 
  } = useDisclosure();
  
  // パスワード確認モーダルの状態
  const { 
    isOpen: isPasswordModalOpen, 
    onOpen: onPasswordModalOpen, 
    onClose: onPasswordModalClose 
  } = useDisclosure();
  
  // データエクスポートモーダルの状態
  const { 
    isOpen: isExportModalOpen, 
    onOpen: onExportModalOpen, 
    onClose: onExportModalClose 
  } = useDisclosure();
  
  // 削除確認用パスワード
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // エクスポート設定
  const [exportOptions, setExportOptions] = useState({
    includeProfile: true,
    includeOrders: true,
    includePaymentInfo: false
  });
  const [exportLoading, setExportLoading] = useState(false);

  // ログアウト処理
  const handleLogout = async () => {
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/users/logout`,
        {},
        {
          headers: {
            Authorization: `Bearer ${session?.accessToken}`
          }
        }
      );
      
      // NextAuthのログアウト処理
      signOut({ callbackUrl: '/auth/signin' });
      
      toast({
        title: 'ログアウト完了',
        description: 'ログアウトしました',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('ログアウトエラー:', error);
      toast({
        title: 'エラー',
        description: 'ログアウト処理に失敗しました',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // アカウント削除前の確認
  const handleDeleteConfirm = () => {
    // パスワード確認モーダルを開く
    onDeleteAlertClose();
    onPasswordModalOpen();
  };

  // アカウント削除処理
  const handleAccountDelete = async () => {
    if (!password) {
      setPasswordError('パスワードを入力してください');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/users/delete-account`,
        { password },
        {
          headers: {
            Authorization: `Bearer ${session?.accessToken}`
          }
        }
      );
      
      // モーダルを閉じる
      onPasswordModalClose();
      
      toast({
        title: 'アカウント削除完了',
        description: 'アカウントが削除されました',
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
      
      // ログアウト処理
      signOut({ callbackUrl: '/' });
    } catch (error: any) {
      console.error('アカウント削除エラー:', error);
      
      const errorMessage = error.response?.data?.message || 'アカウントの削除に失敗しました';
      
      setPasswordError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // データエクスポート処理
  const handleExportData = async () => {
    setExportLoading(true);
    
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/users/export-data`,
        exportOptions,
        {
          headers: {
            Authorization: `Bearer ${session?.accessToken}`
          },
          responseType: 'blob'
        }
      );
      
      // ファイルのダウンロード
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'my-account-data.json');
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      onExportModalClose();
      
      toast({
        title: 'エクスポート完了',
        description: 'アカウントデータのダウンロードが完了しました',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('データエクスポートエラー:', error);
      toast({
        title: 'エラー',
        description: 'データのエクスポートに失敗しました',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <VStack spacing={8} align="stretch">
      <Heading as="h2" size="md">アカウント設定</Heading>
      
      {/* データエクスポートセクション */}
      <Box>
        <Heading as="h3" size="sm" mb={4}>データのエクスポート</Heading>
        <Text mb={4}>アカウント情報や注文履歴などのデータをエクスポートできます。</Text>
        <Button
          leftIcon={<FaDownload />}
          onClick={onExportModalOpen}
          colorScheme="blue"
        >
          データをエクスポート
        </Button>
      </Box>
      
      <Divider />
      
      {/* ログアウトセクション */}
      <Box>
        <Heading as="h3" size="sm" mb={4}>ログアウト</Heading>
        <Text mb={4}>このデバイスからログアウトします。</Text>
        <Button
          leftIcon={<FaSignOutAlt />}
          onClick={handleLogout}
          colorScheme="gray"
        >
          ログアウト
        </Button>
      </Box>
      
      <Divider />
      
      {/* アカウント削除セクション */}
      <Box>
        <Heading as="h3" size="sm" mb={4}>アカウント削除</Heading>
        <Alert status="warning" mb={4} borderRadius="md">
          <AlertIcon />
          アカウントを削除すると、すべてのデータが永久に削除されます。この操作は取り消せません。
        </Alert>
        <Button
          leftIcon={<FaTrash />}
          onClick={onDeleteAlertOpen}
          colorScheme="red"
        >
          アカウントを削除
        </Button>
      </Box>
      
      {/* アカウント削除の確認ダイアログ */}
      <AlertDialog
        isOpen={isDeleteAlertOpen}
        leastDestructiveRef={cancelRef}
        onClose={onDeleteAlertClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              アカウント削除の確認
            </AlertDialogHeader>

            <AlertDialogBody>
              本当にアカウントを削除しますか？この操作は取り消せません。
              <Text mt={2} fontWeight="bold">
                アカウントを削除すると以下のデータが永久に失われます：
              </Text>
              <VStack align="start" mt={2} spacing={1}>
                <Text>• プロフィール情報</Text>
                <Text>• 注文履歴</Text>
                <Text>• 支払い情報</Text>
                <Text>• ポイント残高</Text>
              </VStack>
            </AlertDialogBody>

            <AlertDialogFooter>
              <ButtonGroup>
                <Button ref={cancelRef} onClick={onDeleteAlertClose}>
                  キャンセル
                </Button>
                <Button colorScheme="red" onClick={handleDeleteConfirm}>
                  削除する
                </Button>
              </ButtonGroup>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
      
      {/* パスワード確認モーダル */}
      <Modal isOpen={isPasswordModalOpen} onClose={onPasswordModalClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>パスワードの確認</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Alert status="warning" mb={4} borderRadius="md">
              <AlertIcon />
              セキュリティのため、アカウントを削除するにはパスワードを確認する必要があります。
            </Alert>
            
            <FormControl isInvalid={!!passwordError}>
              <FormLabel>パスワード</FormLabel>
              <Input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setPasswordError('');
                }}
              />
              <FormErrorMessage>{passwordError}</FormErrorMessage>
            </FormControl>
          </ModalBody>

          <ModalFooter>
            <ButtonGroup>
              <Button variant="outline" onClick={onPasswordModalClose}>
                キャンセル
              </Button>
              <Button
                colorScheme="red"
                isLoading={isSubmitting}
                onClick={handleAccountDelete}
              >
                アカウントを完全に削除
              </Button>
            </ButtonGroup>
          </ModalFooter>
        </ModalContent>
      </Modal>
      
      {/* データエクスポートモーダル */}
      <Modal isOpen={isExportModalOpen} onClose={onExportModalClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>データのエクスポート</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text mb={4}>エクスポートするデータを選択してください：</Text>
            
            <VStack align="start" spacing={4}>
              <FormControl>
                <HStack>
                  <input
                    type="checkbox"
                    id="includeProfile"
                    checked={exportOptions.includeProfile}
                    onChange={(e) => setExportOptions({
                      ...exportOptions,
                      includeProfile: e.target.checked
                    })}
                  />
                  <FormLabel htmlFor="includeProfile" mb={0}>
                    プロフィール情報
                  </FormLabel>
                </HStack>
              </FormControl>
              
              <FormControl>
                <HStack>
                  <input
                    type="checkbox"
                    id="includeOrders"
                    checked={exportOptions.includeOrders}
                    onChange={(e) => setExportOptions({
                      ...exportOptions,
                      includeOrders: e.target.checked
                    })}
                  />
                  <FormLabel htmlFor="includeOrders" mb={0}>
                    注文履歴
                  </FormLabel>
                </HStack>
              </FormControl>
              
              <FormControl>
                <HStack>
                  <input
                    type="checkbox"
                    id="includePaymentInfo"
                    checked={exportOptions.includePaymentInfo}
                    onChange={(e) => setExportOptions({
                      ...exportOptions,
                      includePaymentInfo: e.target.checked
                    })}
                  />
                  <FormLabel htmlFor="includePaymentInfo" mb={0}>
                    支払い情報
                  </FormLabel>
                </HStack>
              </FormControl>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <ButtonGroup>
              <Button variant="outline" onClick={onExportModalClose}>
                キャンセル
              </Button>
              <Button
                colorScheme="blue"
                isLoading={exportLoading}
                onClick={handleExportData}
                isDisabled={!exportOptions.includeProfile && !exportOptions.includeOrders && !exportOptions.includePaymentInfo}
              >
                ダウンロード
              </Button>
            </ButtonGroup>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </VStack>
  );
} 