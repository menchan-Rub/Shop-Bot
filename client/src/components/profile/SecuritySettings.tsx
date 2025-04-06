import React, { useState } from 'react';
import {
  VStack, Heading, FormControl, FormLabel, Input, Button,
  FormErrorMessage, useToast, HStack, Box, Divider, Text,
  Alert, AlertIcon, Switch, InputGroup, InputRightElement
} from '@chakra-ui/react';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons';

export default function SecuritySettings() {
  const { data: session } = useSession();
  const toast = useToast();

  // パスワード変更用の状態
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  
  // パスワード表示/非表示の状態
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // 二要素認証の状態
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [twoFactorLoading, setTwoFactorLoading] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [setupMode, setSetupMode] = useState(false);

  // 二要素認証の状態を取得
  React.useEffect(() => {
    const fetchTwoFactorStatus = async () => {
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/users/2fa/status`,
          {
            headers: {
              Authorization: `Bearer ${session?.accessToken}`
            }
          }
        );
        setTwoFactorEnabled(response.data.enabled);
      } catch (error) {
        console.error('二要素認証状態の取得に失敗:', error);
      }
    };

    if (session?.accessToken) {
      fetchTwoFactorStatus();
    }
  }, [session?.accessToken]);

  // パスワード変更のバリデーション
  const validatePasswordForm = () => {
    const newErrors: { [key: string]: string } = {};
    
    if (!currentPassword) {
      newErrors.currentPassword = '現在のパスワードを入力してください';
    }
    
    if (!newPassword) {
      newErrors.newPassword = '新しいパスワードを入力してください';
    } else if (newPassword.length < 8) {
      newErrors.newPassword = 'パスワードは8文字以上必要です';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
      newErrors.newPassword = 'パスワードには大文字、小文字、数字を含める必要があります';
    }
    
    if (!confirmPassword) {
      newErrors.confirmPassword = '確認用パスワードを入力してください';
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'パスワードが一致しません';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // パスワード変更の送信
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePasswordForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/users/change-password`,
        {
          currentPassword,
          newPassword
        },
        {
          headers: {
            Authorization: `Bearer ${session?.accessToken}`
          }
        }
      );
      
      toast({
        title: '更新完了',
        description: 'パスワードが更新されました',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      // フォームをリセット
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      console.error('パスワード更新エラー:', error);
      
      const errorMessage = error.response?.data?.message || 'パスワードの更新に失敗しました';
      
      toast({
        title: 'エラー',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 二要素認証のセットアップ開始
  const handleSetup2FA = async () => {
    setTwoFactorLoading(true);
    
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/users/2fa/setup`,
        {},
        {
          headers: {
            Authorization: `Bearer ${session?.accessToken}`
          }
        }
      );
      
      setQrCodeUrl(response.data.qrCodeUrl);
      setSetupMode(true);
    } catch (error) {
      console.error('2FA設定エラー:', error);
      toast({
        title: 'エラー',
        description: '二要素認証の設定に失敗しました',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setTwoFactorLoading(false);
    }
  };

  // 二要素認証の有効化/検証
  const handleVerify2FA = async () => {
    setTwoFactorLoading(true);
    
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/users/2fa/verify`,
        {
          code: verificationCode
        },
        {
          headers: {
            Authorization: `Bearer ${session?.accessToken}`
          }
        }
      );
      
      setTwoFactorEnabled(true);
      setSetupMode(false);
      setQrCodeUrl(null);
      setVerificationCode('');
      
      toast({
        title: '設定完了',
        description: '二要素認証が有効化されました',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('2FA検証エラー:', error);
      toast({
        title: 'エラー',
        description: '検証コードが無効です',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setTwoFactorLoading(false);
    }
  };

  // 二要素認証の無効化
  const handleDisable2FA = async () => {
    setTwoFactorLoading(true);
    
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/users/2fa/disable`,
        {},
        {
          headers: {
            Authorization: `Bearer ${session?.accessToken}`
          }
        }
      );
      
      setTwoFactorEnabled(false);
      toast({
        title: '設定変更',
        description: '二要素認証が無効化されました',
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('2FA無効化エラー:', error);
      toast({
        title: 'エラー',
        description: '二要素認証の無効化に失敗しました',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setTwoFactorLoading(false);
    }
  };

  return (
    <VStack spacing={8} align="stretch">
      <Heading as="h2" size="md">セキュリティ設定</Heading>
      
      {/* パスワード変更セクション */}
      <Box as="form" onSubmit={handlePasswordChange}>
        <Heading as="h3" size="sm" mb={4}>パスワード変更</Heading>
        
        <VStack spacing={4} align="stretch">
          <FormControl isInvalid={!!errors.currentPassword}>
            <FormLabel>現在のパスワード</FormLabel>
            <InputGroup>
              <Input
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
              <InputRightElement>
                <Button
                  variant="ghost"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  {showCurrentPassword ? <ViewOffIcon /> : <ViewIcon />}
                </Button>
              </InputRightElement>
            </InputGroup>
            <FormErrorMessage>{errors.currentPassword}</FormErrorMessage>
          </FormControl>
          
          <FormControl isInvalid={!!errors.newPassword}>
            <FormLabel>新しいパスワード</FormLabel>
            <InputGroup>
              <Input
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <InputRightElement>
                <Button
                  variant="ghost"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? <ViewOffIcon /> : <ViewIcon />}
                </Button>
              </InputRightElement>
            </InputGroup>
            <FormErrorMessage>{errors.newPassword}</FormErrorMessage>
          </FormControl>
          
          <FormControl isInvalid={!!errors.confirmPassword}>
            <FormLabel>パスワード確認</FormLabel>
            <InputGroup>
              <Input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <InputRightElement>
                <Button
                  variant="ghost"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <ViewOffIcon /> : <ViewIcon />}
                </Button>
              </InputRightElement>
            </InputGroup>
            <FormErrorMessage>{errors.confirmPassword}</FormErrorMessage>
          </FormControl>
          
          <Button
            type="submit"
            colorScheme="blue"
            isLoading={isSubmitting}
            loadingText="更新中..."
          >
            パスワードを変更
          </Button>
        </VStack>
      </Box>
      
      <Divider />
      
      {/* 二要素認証セクション */}
      <Box>
        <Heading as="h3" size="sm" mb={4}>二要素認証</Heading>
        
        {!setupMode ? (
          <HStack justify="space-between" align="center">
            <Box>
              <Text fontWeight="bold">二要素認証</Text>
              <Text fontSize="sm" color="gray.500">
                アカウントのセキュリティを強化するために二要素認証を有効にします
              </Text>
            </Box>
            
            <HStack>
              <Switch
                isChecked={twoFactorEnabled}
                onChange={() => {
                  if (twoFactorEnabled) {
                    handleDisable2FA();
                  } else {
                    handleSetup2FA();
                  }
                }}
                isDisabled={twoFactorLoading}
              />
              <Text>{twoFactorEnabled ? 'オン' : 'オフ'}</Text>
            </HStack>
          </HStack>
        ) : (
          <VStack spacing={4} align="stretch">
            <Alert status="info">
              <AlertIcon />
              スマートフォンの認証アプリでQRコードをスキャンし、表示されたコードを入力してください
            </Alert>
            
            {qrCodeUrl && (
              <Box textAlign="center" my={4}>
                <img src={qrCodeUrl} alt="2FA QR Code" style={{ display: 'inline-block' }} />
              </Box>
            )}
            
            <FormControl>
              <FormLabel>認証コード</FormLabel>
              <Input
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder="6桁のコードを入力"
              />
            </FormControl>
            
            <HStack>
              <Button
                colorScheme="blue"
                onClick={handleVerify2FA}
                isLoading={twoFactorLoading}
              >
                確認
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setSetupMode(false);
                  setQrCodeUrl(null);
                  setVerificationCode('');
                }}
              >
                キャンセル
              </Button>
            </HStack>
          </VStack>
        )}
      </Box>
      
      <Divider />
      
      {/* セッション管理セクション */}
      <Box>
        <Heading as="h3" size="sm" mb={4}>アクティブセッション</Heading>
        
        <HStack justify="space-between" align="center">
          <Box>
            <Text fontWeight="bold">すべてのデバイスからログアウト</Text>
            <Text fontSize="sm" color="gray.500">
              すべてのデバイスで現在のセッションを終了し、再ログインが必要になります
            </Text>
          </Box>
          
          <Button
            colorScheme="red"
            variant="outline"
            onClick={async () => {
              try {
                await axios.post(
                  `${process.env.NEXT_PUBLIC_API_URL}/api/users/logout-all`,
                  {},
                  {
                    headers: {
                      Authorization: `Bearer ${session?.accessToken}`
                    }
                  }
                );
                
                toast({
                  title: 'ログアウト完了',
                  description: 'すべてのデバイスからログアウトしました',
                  status: 'success',
                  duration: 3000,
                  isClosable: true,
                });
                
                // 現在のページをリロード（ログアウト状態にする）
                window.location.href = '/auth/signin';
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
            }}
          >
            すべてのセッションを終了
          </Button>
        </HStack>
      </Box>
    </VStack>
  );
} 