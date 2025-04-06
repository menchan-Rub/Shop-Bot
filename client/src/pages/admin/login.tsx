import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Container,
  Heading,
  Text,
  VStack,
  Alert,
  AlertIcon,
  useColorModeValue,
  Center,
  Image,
  Flex,
  useToast,
  Spinner,
  Tabs, 
  TabList, 
  TabPanels, 
  Tab, 
  TabPanel,
  FormControl,
  FormLabel,
  Input,
  InputGroup,
  InputRightElement,
  FormErrorMessage,
  Divider
} from '@chakra-ui/react';
import { FaDiscord, FaEye, FaEyeSlash } from 'react-icons/fa';
import { useRouter } from 'next/router';
import { signIn, useSession, getSession } from 'next-auth/react';
import Head from 'next/head';
import { GetServerSideProps } from 'next';
import axios from 'axios';

export default function AdminLogin() {
  const { data: session, status, update } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();
  const toast = useToast();
  const [isClient, setIsClient] = useState(false);

  // クライアントサイドかどうかを確認
  useEffect(() => {
    setIsClient(true);
  }, []);

  // セッションによる自動リダイレクト
  useEffect(() => {
    // ログイン済みの場合は管理者ダッシュボードへリダイレクト
    const checkSessionAndRedirect = async () => {
      try {
        if (status === 'loading') return;

        // セッション認証済みユーザーを確認
        if (status === 'authenticated') {
          console.log('セッション認証済み - ユーザー情報:', session?.user);
          
          const isAdmin = session?.user?.isAdmin || session?.user?.role === 'admin';
          
          if (isAdmin) {
            console.log('管理者セッション検出 - ダッシュボードへリダイレクト');
            // セッション情報から管理者だと確認できたら、ローカルストレージにも記録
            if (typeof window !== 'undefined') {
              localStorage.setItem('adminToken', 'admin-email-auth');
            }
            router.push('/admin');
            return;
          }
        }
        
        // ローカルストレージのトークンをチェック
        if (isClient) {
          const adminToken = localStorage.getItem('adminToken');
          if (adminToken === 'admin-email-auth') {
            console.log('管理者トークン検出 - ダッシュボードへリダイレクト');
            router.push('/admin');
            return;
          }
        }
      } catch (error) {
        console.error('セッションチェックエラー:', error);
      }
    };
    
    checkSessionAndRedirect();
  }, [session, status, router, isClient]);

  // ログイン処理
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      // メールアドレスとパスワードのバリデーション
      if (!email || !password) {
        setError('メールアドレスとパスワードを入力してください');
        setIsLoading(false);
        return;
      }

      // 認証APIを呼び出し
      const response = await axios.post(
        `/api/auth/admin-login`, // クライアントサイドのAPI Routeを使用
        { email, password }
      );
      
      // レスポンスからトークンを取得
      const { token, user } = response.data;
      
      // ログイン成功のフィードバック
      toast({
        title: 'ログイン成功',
        description: '管理者ダッシュボードにリダイレクトします',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      // 安全にローカルストレージにトークンを保存
      if (typeof window !== 'undefined') {
        localStorage.setItem('adminToken', token || 'admin-email-auth');
      }
      
      // セッション更新
      if (update) {
        try {
          await update({
            ...session,
            user: {
              ...session?.user,
              isAdmin: true,
              role: 'admin',
              adminToken: true
            }
          });
          console.log('セッション情報を更新しました');
        } catch (updateError) {
          console.error('セッション更新エラー:', updateError);
        }
      }
      
      // 管理者ダッシュボードへリダイレクト
      router.push('/admin');
      
    } catch (error) {
      console.error('ログインエラー:', error);
      setError('ログインに失敗しました。認証情報を確認してください。');
      toast({
        title: 'ログインエラー',
        description: error.response?.data?.message || 'ログインに失敗しました',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // タブインデックス
  const [tabIndex, setTabIndex] = useState(0);
  
  // メールログイン用の状態
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  
  // パスワード表示切り替え
  const handleTogglePassword = () => setShowPassword(!showPassword);
  
  // 背景色
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.600', 'gray.200');
  const buttonColorScheme = 'blue';

  // エラーメッセージを処理
  useEffect(() => {
    if (router.query.error) {
      switch (router.query.error) {
        case 'unauthorized':
          setError('管理者権限がありません。このアカウントは管理者として登録されていません。');
          break;
        case 'session_expired':
          setError('セッションが期限切れになりました。再度ログインしてください。');
          break;
        default:
          setError('エラーが発生しました。もう一度お試しください。');
          break;
      }
    }
  }, [router.query]);

  // Discordでログイン
  const handleDiscordLogin = async () => {
    setIsLoading(true);
    try {
      await signIn('discord', { callbackUrl: '/admin/login' });
    } catch (error) {
      console.error('Discord ログインエラー:', error);
      toast({
        title: 'ログインに失敗しました',
        description: 'もう一度お試しください',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      setIsLoading(false);
    }
  };

  // ログイン中またはアクセス権チェック中
  if (isLoading) {
    return (
      <Center h="100vh">
        <VStack spacing={4}>
          <Spinner size="xl" thickness="4px" speed="0.65s" color="blue.500" />
          <Text>
            {error ? error : 'ログイン中...'}
          </Text>
        </VStack>
      </Center>
    );
  }

  return (
    <>
      <Head>
        <title>管理者ログイン | Shop</title>
      </Head>
      
      <Container maxW="md" py={12}>
        <Box
          bg={bgColor}
          p={8}
          borderRadius="lg"
          boxShadow="lg"
          borderWidth="1px"
          borderColor={borderColor}
        >
          <VStack spacing={6}>
            <Heading size="lg">管理者ログイン</Heading>
            
            <Center w="full">
              <Image src="/admin-login-icon.png" alt="管理者ログイン" boxSize="100px" fallback={<Box boxSize="100px" bg="gray.200" borderRadius="full" />} />
            </Center>
            
            {error && (
              <Alert status="error" borderRadius="md">
                <AlertIcon />
                {error}
              </Alert>
            )}
            
            <Tabs 
              isFitted 
              variant="soft-rounded" 
              colorScheme="blue" 
              index={tabIndex} 
              onChange={setTabIndex}
              width="full"
            >
              <TabList mb="1em">
                <Tab>メールログイン</Tab>
                <Tab>Discordログイン</Tab>
              </TabList>
              
              <TabPanels>
                {/* メールログインタブ */}
                <TabPanel p={0}>
                  <form onSubmit={handleLogin}>
                    <VStack spacing={4} align="flex-start" w="full">
                      <FormControl isRequired isInvalid={!!errors.email}>
                        <FormLabel>管理者メールアドレス</FormLabel>
                        <Input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="admin@example.com"
                        />
                        <FormErrorMessage>{errors.email}</FormErrorMessage>
                      </FormControl>
                      
                      <FormControl isRequired isInvalid={!!errors.password}>
                        <FormLabel>パスワード</FormLabel>
                        <InputGroup>
                          <Input
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="パスワード"
                          />
                          <InputRightElement width="4.5rem">
                            <Button h="1.75rem" size="sm" onClick={handleTogglePassword}>
                              {showPassword ? <FaEyeSlash /> : <FaEye />}
                            </Button>
                          </InputRightElement>
                        </InputGroup>
                        <FormErrorMessage>{errors.password}</FormErrorMessage>
                      </FormControl>
                      
                      <Button
                        type="submit"
                        colorScheme="blue"
                        w="full"
                        isLoading={isSubmitting}
                        loadingText="ログイン中..."
                      >
                        管理者ログイン
                      </Button>
                    </VStack>
                  </form>
                  
                  {/* デモログインボタン */}
                  <Box mt={4} textAlign="center">
                    <Button
                      onClick={() => {
                        if (typeof window !== 'undefined') {
                          // 長期間有効なデモ管理者トークンを設定
                          localStorage.setItem('adminToken', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEiLCJuYW1lIjoiQWRtaW4gVXNlciIsImVtYWlsIjoiYWRtaW5AZXhhbXBsZS5jb20iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE2MTU0MjM4MjAsImV4cCI6MTkxNTUxMDIyMH0.i5ZcGs8FZ_kGkS9DTlr5eKB-1bvYGXJGOgjD7KbqZOw');
                          router.push('/admin');
                        }
                      }}
                      variant="outline"
                      colorScheme="green"
                      size="md"
                      w="full"
                      mt={2}
                    >
                      デモ管理者としてログイン
                    </Button>
                  </Box>
                </TabPanel>
                
                {/* Discordログインタブ */}
                <TabPanel p={0}>
                  <VStack spacing={6}>
                    <Text textAlign="center">
                      Discordアカウントで認証してください。管理者権限を持つDiscordアカウントのみログインできます。
                    </Text>
                    
                    <Button
                      leftIcon={<FaDiscord />}
                      colorScheme={buttonColorScheme}
                      size="lg"
                      width="full"
                      onClick={handleDiscordLogin}
                      isLoading={isLoading}
                      loadingText="認証中..."
                    >
                      Discordでログイン
                    </Button>
                    
                    <Flex width="full" justifyContent="center" fontSize="sm" color={textColor}>
                      <Text>
                        管理者権限がないアカウントではログインできません
                      </Text>
                    </Flex>
                  </VStack>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </VStack>
        </Box>
      </Container>
    </>
  );
}

// サーバーサイドでのセッションチェック
export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context);

  // セッションがあってもリダイレクトしない
  // 管理者チェックはクライアント側で行う
  return {
    props: {}
  };
}; 