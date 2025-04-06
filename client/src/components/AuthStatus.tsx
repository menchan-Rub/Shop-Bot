import { useSession, signIn, signOut } from "next-auth/react";
import {
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Avatar,
  Box,
  Text,
  Flex,
  Icon,
  Spinner,
  useToast,
  Badge,
} from "@chakra-ui/react";
import { FaChevronDown, FaUser, FaSignOutAlt, FaShieldAlt, FaBug } from "react-icons/fa";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export const AuthStatus = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const toast = useToast();
  const [showDebug, setShowDebug] = useState(false);
  
  // セッションの詳細をコンソールに出力（デバッグ用）
  useEffect(() => {
    console.log('AuthStatus更新 - session:', session);
    console.log('AuthStatus更新 - status:', status);
  }, [session, status]);

  // セッション情報の問題をログに記録するだけ（リロードしない）
  useEffect(() => {
    if (status === 'authenticated' && (!session?.user || !session.user.name)) {
      console.log('Session has invalid user data, but continuing without refresh...');
      // 問題を記録するだけで、リロードは行わない
    }
  }, [session, status]);

  // ローディング中の表示
  if (status === 'loading') {
    return (
      <Flex align="center">
        <Spinner size="sm" mr={2} />
        <Text fontSize="sm">ロード中...</Text>
      </Flex>
    );
  }

  // 未ログインの場合、またはユーザー情報が不完全な場合
  if (status !== 'authenticated' || !session?.user) {
    return (
      <Button
        size="sm"
        colorScheme="purple"
        onClick={() => {
          console.log('Login button clicked');
          
          // Discordプロバイダーでサインイン - シンプルな呼び出しに修正
          signIn('discord');
        }}
      >
        ログイン
      </Button>
    );
  }

  // ユーザー情報
  const userName = session.user.name || 'ユーザー';
  const userImage = session.user.image || undefined;
  const isAdmin = session.user.isAdmin || false;

  // デバッグ情報を切り替える
  const toggleDebug = () => setShowDebug(!showDebug);

  // ログイン済みの場合
  return (
    <Menu>
      <MenuButton 
        as={Button} 
        rightIcon={<Icon as={FaChevronDown} />}
        variant="ghost"
      >
        <Flex align="center">
          <Avatar 
            size="xs" 
            src={userImage} 
            mr={2} 
            name={userName}
          />
          <Text display={{ base: 'none', md: 'block' }}>
            {userName}
          </Text>
          {isAdmin && (
            <Badge ml={2} colorScheme="red">管理者</Badge>
          )}
        </Flex>
      </MenuButton>
      <MenuList>
        <Text px={3} py={2} fontWeight="bold" fontSize="sm">
          {userName}
        </Text>
        
        <MenuItem 
          icon={<Icon as={FaUser} />}
          onClick={() => router.push('/profile')}
        >
          プロフィール
        </MenuItem>
        
        {isAdmin && (
          <MenuItem 
            icon={<Icon as={FaShieldAlt} />}
            onClick={() => router.push('/admin')}
          >
            管理パネル
          </MenuItem>
        )}
        
        <MenuItem 
          icon={<Icon as={FaBug} />}
          onClick={toggleDebug}
        >
          デバッグ情報表示
        </MenuItem>
        
        <MenuItem 
          icon={<Icon as={FaSignOutAlt} />}
          onClick={() => {
            console.log('Logout clicked');
            signOut({ callbackUrl: '/' });
          }}
        >
          ログアウト
        </MenuItem>
        
        {showDebug && (
          <Box px={3} py={2} fontSize="xs" bg="gray.100" mt={2}>
            <Text fontWeight="bold">デバッグ情報:</Text>
            <Text>ID: {session.user.id}</Text>
            <Text>名前: {session.user.name}</Text>
            <Text>メール: {session.user.email}</Text>
            <Text>管理者: {isAdmin ? 'はい' : 'いいえ'}</Text>
          </Box>
        )}
      </MenuList>
    </Menu>
  );
}; 