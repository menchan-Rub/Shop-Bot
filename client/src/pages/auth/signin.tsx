import React, { useState, useEffect } from 'react';
import { 
  Box, Button, Container, Heading, Text, VStack, HStack,
  FormControl, FormLabel, Input, InputGroup, InputRightElement,
  FormErrorMessage, useColorModeValue, useToast, Center,
  Tabs, TabList, TabPanels, Tab, TabPanel, Divider, Link as ChakraLink
} from '@chakra-ui/react';
import { signIn } from 'next-auth/react';
import Layout from '@/components/Layout';
import { FaDiscord, FaEye, FaEyeSlash } from 'react-icons/fa';
import { useRouter } from 'next/router';
import NextLink from 'next/link';
import axios from 'axios';

// 開発環境でのみログを出力する
const logDebug = (...args: any[]) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(...args);
  }
};

// サインインページ
export default function SignIn() {
  const router = useRouter();
  const toast = useToast();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  // タブインデックス
  const [tabIndex, setTabIndex] = useState(0);
  
  // フォーム状態 (メールログイン)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  
  // パスワード表示切り替え
  const handleTogglePassword = () => setShowPassword(!showPassword);
  
  // クエリパラメータの処理
  useEffect(() => {
    const { error, verified } = router.query;
    
    // エラーメッセージがあれば表示
    if (error) {
      toast({
        title: "ログインエラー",
        description: String(error),
        status: "error",
        duration: 9000,
        isClosable: true,
      });
    }
    
    // メール認証成功のメッセージ
    if (verified === 'true') {
      toast({
        title: "メール認証完了",
        description: "メールアドレスの確認が完了しました。ログインしてください。",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
    }
  }, [router.query, toast]);
  
  // メールパスワードでのログイン処理
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // バリデーション
    const newErrors: typeof errors = {};
    if (!email.trim()) newErrors.email = 'メールアドレスを入力してください';
    if (!password) newErrors.password = 'パスワードを入力してください';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setIsSubmitting(true);
    setErrors({});
    
    try {
      // デバッグログ
      console.log('ログイン試行:', { email });
      
      // 作成したメール認証APIを呼び出す
      const apiResponse = await axios.post('/api/email-signin', {
        email,
        password
      });
      
      if (apiResponse.data.success) {
        // 認証成功後にNextAuthのサインインを行う
        const result = await signIn('credentials', {
          email,
          password,
          redirect: false
        });
        
        if (result?.error) {
          console.error('NextAuth Error:', result.error);
          toast({
            title: "ログインエラー",
            description: result.error,
            status: "error",
            duration: 5000,
            isClosable: true,
          });
        } else {
          console.log('ログイン成功:', apiResponse.data.user);
          
          // リダイレクト先
          const callbackUrl = router.query.callbackUrl as string || '/';
          router.push(callbackUrl);
        }
      }
    } catch (error: any) {
      console.error('Login error:', error);
      
      // エラーメッセージの表示
      const errorMessage = error.response?.data?.error || 'ログイン中にエラーが発生しました';
      toast({
        title: "ログインエラー",
        description: errorMessage,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      
      // エラー内容によってフォームのエラー表示
      if (errorMessage.includes('メールアドレスまたはパスワード')) {
        setErrors({
          email: ' ',
          password: 'メールアドレスまたはパスワードが正しくありません'
        });
      } else if (errorMessage.includes('メールアドレスの確認')) {
        setErrors({
          email: 'メールアドレスの確認が完了していません'
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Discordでのログイン処理
  const handleDiscordLogin = () => {
    logDebug('Discordログインボタンがクリックされました');
    
    // コールバックURLを指定せず、デフォルトのリダイレクト処理に任せる
    signIn('discord', {
      redirect: true
    });
  };
  
  return (
    <Layout>
      <Container maxW="container.md" py={10}>
        <Center>
          <Box
            bg={bgColor}
            p={8}
            borderRadius="lg"
            shadow="md"
            borderWidth="1px"
            borderColor={borderColor}
            w="full"
            maxW="md"
          >
            <VStack spacing={6} align="center">
              <Heading as="h1" size="xl">
                ログイン
              </Heading>
              
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
                    <form onSubmit={handleEmailLogin}>
                      <VStack spacing={4} align="flex-start" w="full">
                        <FormControl isRequired isInvalid={!!errors.email}>
                          <FormLabel>メールアドレス</FormLabel>
                          <Input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="example@example.com"
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
                        
                        <ChakraLink 
                          as={NextLink} 
                          href="/auth/forgot-password"
                          fontSize="sm"
                          color="blue.500"
                          alignSelf="flex-end"
                        >
                          パスワードをお忘れですか？
                        </ChakraLink>
                        
                        <Button
                          type="submit"
                          colorScheme="blue"
                          w="full"
                          isLoading={isSubmitting}
                          loadingText="ログイン中..."
                        >
                          ログイン
                        </Button>
                        
                        <HStack w="full" justify="center" pt={2}>
                          <Text fontSize="sm">
                            アカウントをお持ちでない場合は
                          </Text>
                          <ChakraLink 
                            as={NextLink} 
                            href="/auth/signup"
                            fontSize="sm"
                            color="blue.500"
                          >
                            登録
                          </ChakraLink>
                        </HStack>
                      </VStack>
                    </form>
                  </TabPanel>
                  
                  {/* Discordログインタブ */}
                  <TabPanel p={0}>
                    <VStack spacing={6} align="center">
                      <Text>Discordアカウントでログインしてください</Text>
                      
                      <Button
                        leftIcon={<FaDiscord />}
                        colorScheme="purple"
                        onClick={handleDiscordLogin}
                        size="lg"
                        w="full"
                      >
                        Discordでログイン
                      </Button>
                      
                      <Divider />
                      
                      <Text fontSize="sm" textAlign="center">
                        Discordアカウントをお持ちでない場合は、
                        <ChakraLink
                          href="https://discord.com/register"
                          isExternal
                          color="blue.500"
                        >
                          こちら
                        </ChakraLink>
                        から作成できます。
                      </Text>
                    </VStack>
                  </TabPanel>
                </TabPanels>
              </Tabs>
            </VStack>
          </Box>
        </Center>
      </Container>
    </Layout>
  );
}