import React, { useEffect } from 'react';
import { 
  Box, Heading, Text, Container, Button, Code, 
  VStack, HStack, Divider, useColorModeValue
} from '@chakra-ui/react';
import { useSession, signIn, signOut, getSession } from 'next-auth/react';
import Layout from '@/components/Layout';

export default function AuthDebug() {
  const { data: session, status } = useSession();
  const bgColor = useColorModeValue('gray.50', 'gray.700');
  const tokenColor = useColorModeValue('pink.50', 'pink.900');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  useEffect(() => {
    // コンポーネントマウント時にセッションを更新
    const updateSession = async () => {
      const session = await getSession();
      console.log('最新のセッション:', session);
    };
    
    updateSession();
  }, []);

  const refreshSession = async () => {
    const updatedSession = await getSession();
    console.log('セッション更新:', updatedSession);
    window.location.reload();
  };

  const clearAdminToken = () => {
    localStorage.removeItem('adminToken');
    console.log('管理者トークンを削除しました');
    window.location.reload();
  };

  // ローカルストレージからadminTokenを取得
  const getAdminToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('adminToken');
    }
    return null;
  };

  return (
    <Layout>
      <Container maxW="container.md" py={8}>
        <VStack spacing={8} align="stretch">
          <Box>
            <Heading as="h1" size="xl" mb={2}>認証デバッグ</Heading>
            <Text color="gray.500">現在のセッション状態の詳細情報</Text>
          </Box>

          <Box 
            p={5} 
            bg={bgColor} 
            borderRadius="md" 
            borderWidth="1px"
            borderColor={borderColor}
          >
            <VStack align="stretch" spacing={4}>
              <Box>
                <Heading as="h2" size="md">セッションステータス</Heading>
                <Text fontSize="lg" fontWeight="bold" mt={2}>
                  {status === 'authenticated' && '✅ 認証済み'}
                  {status === 'loading' && '⏳ 読み込み中...'}
                  {status === 'unauthenticated' && '❌ 未認証'}
                </Text>
              </Box>

              <Divider />

              <Box>
                <Heading as="h2" size="md" mb={4}>セッション情報</Heading>
                {session ? (
                  <VStack align="stretch" spacing={3}>
                    <Box>
                      <Text fontWeight="bold">ユーザーID</Text>
                      <Code p={2} borderRadius="md" width="full">{session.user.id || '未設定'}</Code>
                    </Box>
                    
                    <Box>
                      <Text fontWeight="bold">名前</Text>
                      <Code p={2} borderRadius="md" width="full">{session.user.name || '未設定'}</Code>
                    </Box>
                    
                    <Box>
                      <Text fontWeight="bold">メールアドレス</Text>
                      <Code p={2} borderRadius="md" width="full">{session.user.email || '未設定'}</Code>
                    </Box>
                    
                    <Box>
                      <Text fontWeight="bold">Discord ID</Text>
                      <Code p={2} borderRadius="md" width="full">{session.user.discordId || '未設定'}</Code>
                    </Box>
                    
                    <Box>
                      <Text fontWeight="bold">管理者権限</Text>
                      <Code p={2} borderRadius="md" width="full">
                        {session.user.isAdmin ? '✅ あり' : '❌ なし'}
                      </Code>
                    </Box>
                    
                    <Box>
                      <Text fontWeight="bold">ロール</Text>
                      <Code p={2} borderRadius="md" width="full">{session.user.role || '未設定'}</Code>
                    </Box>
                    
                    <Box>
                      <Text fontWeight="bold">セッション期限</Text>
                      <Code p={2} borderRadius="md" width="full">{session.expires}</Code>
                    </Box>
                    
                    <Box>
                      <Text fontWeight="bold">管理者トークン（LocalStorage）</Text>
                      <Code p={2} borderRadius="md" width="full">{getAdminToken() || '未設定'}</Code>
                    </Box>
                  </VStack>
                ) : (
                  <Text>セッションが存在しません</Text>
                )}
              </Box>
              
              <Divider />
              
              <Box>
                <Heading as="h2" size="md" mb={4}>セッション管理</Heading>
                <HStack spacing={4}>
                  {!session ? (
                    <>
                      <Button colorScheme="blue" onClick={() => signIn()}>
                        ログイン
                      </Button>
                      <Button colorScheme="blue" onClick={() => signIn('discord')}>
                        Discord ログイン
                      </Button>
                    </>
                  ) : (
                    <Button colorScheme="red" onClick={() => signOut()}>
                      ログアウト
                    </Button>
                  )}
                  <Button colorScheme="purple" onClick={refreshSession}>
                    セッション更新
                  </Button>
                  <Button colorScheme="orange" onClick={clearAdminToken}>
                    管理者トークンクリア
                  </Button>
                </HStack>
              </Box>
              
              <Divider />
              
              <Box>
                <Heading as="h2" size="md" mb={4}>全セッションデータ (JSON)</Heading>
                <Box 
                  p={3} 
                  bg={tokenColor} 
                  borderRadius="md"
                  overflowX="auto"
                >
                  <pre>{JSON.stringify(session, null, 2)}</pre>
                </Box>
              </Box>
            </VStack>
          </Box>
        </VStack>
      </Container>
    </Layout>
  );
} 