import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import {
  Container,
  VStack,
  Heading,
  Text,
  Code,
  Button,
  useToast,
  Alert,
  AlertIcon,
  Divider,
  Box,
} from '@chakra-ui/react';

export default function DebugPage() {
  const { data: session, status } = useSession();
  const [envVars, setEnvVars] = useState<Record<string, string>>({});
  const toast = useToast();

  // 環境変数を取得
  useEffect(() => {
    // クライアントサイドで利用可能な環境変数（NEXT_PUBLIC_プレフィックス付き）を収集
    const publicEnvVars: Record<string, string> = {};
    Object.keys(process.env).forEach(key => {
      if (key.startsWith('NEXT_PUBLIC_')) {
        publicEnvVars[key] = process.env[key] as string;
      }
    });
    setEnvVars(publicEnvVars);
  }, []);

  // 管理者IDの比較を行う関数
  const compareIds = () => {
    if (!session?.user?.id) {
      toast({
        title: "エラー",
        description: "ユーザーIDが取得できません",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const adminIds = process.env.NEXT_PUBLIC_ADMIN_USER_IDS || '';
    const userIdFromSession = session.user.id;
    
    const adminIdsArray = adminIds.split(',').map(id => id.trim());
    const isAdmin = adminIdsArray.includes(userIdFromSession);
    
    toast({
      title: isAdmin ? "管理者権限あり" : "管理者権限なし",
      description: `ユーザーID: ${userIdFromSession}\n環境変数ID: ${adminIds}\n一致: ${isAdmin ? "はい" : "いいえ"}`,
      status: isAdmin ? "success" : "info",
      duration: 5000,
      isClosable: true,
    });
  };

  if (status === 'loading') {
    return (
      <Container maxW="container.md" py={8}>
        <Text>読み込み中...</Text>
      </Container>
    );
  }

  return (
    <Container maxW="container.md" py={8}>
      <VStack spacing={8} align="stretch">
        <Heading as="h1" size="xl" textAlign="center">デバッグ情報</Heading>

        <Alert status="info" borderRadius="md">
          <AlertIcon />
          このページは管理者権限の問題をデバッグするためのものです
        </Alert>

        <Box p={5} borderWidth="1px" borderRadius="md">
          <Heading as="h2" size="md" mb={4}>セッション情報</Heading>
          {session ? (
            <VStack align="stretch" spacing={3}>
              <Box>
                <Text fontWeight="bold">ログイン状態:</Text>
                <Text>ログイン済み</Text>
              </Box>
              <Box>
                <Text fontWeight="bold">ユーザー名:</Text>
                <Text>{session.user?.name}</Text>
              </Box>
              <Box>
                <Text fontWeight="bold">ユーザーID:</Text>
                <Code p={2} borderRadius="md">
                  {session.user?.id}
                </Code>
              </Box>
              <Box>
                <Text fontWeight="bold">管理者権限:</Text>
                <Text>{session.user?.isAdmin ? "あり" : "なし"}</Text>
              </Box>
            </VStack>
          ) : (
            <Text>ログインしていません</Text>
          )}
        </Box>

        <Box p={5} borderWidth="1px" borderRadius="md">
          <Heading as="h2" size="md" mb={4}>環境変数（NEXT_PUBLIC_のみ）</Heading>
          <VStack align="stretch" spacing={3}>
            {Object.entries(envVars).map(([key, value]) => (
              <Box key={key}>
                <Text fontWeight="bold">{key}:</Text>
                <Code p={2} borderRadius="md" fontSize="sm">
                  {value}
                </Code>
              </Box>
            ))}
            {Object.keys(envVars).length === 0 && (
              <Text>表示可能な環境変数はありません</Text>
            )}
          </VStack>
        </Box>

        <Divider />

        <Box textAlign="center">
          <Button colorScheme="blue" onClick={compareIds}>
            IDを比較する
          </Button>
        </Box>
      </VStack>
    </Container>
  );
} 