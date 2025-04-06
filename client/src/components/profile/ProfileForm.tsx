import React, { useState } from 'react';
import {
  VStack, Heading, FormControl, FormLabel, Input, Button,
  FormErrorMessage, useToast, Textarea, Flex, Box, Text,
  InputGroup, InputLeftAddon, HStack, Avatar
} from '@chakra-ui/react';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import { FaUser, FaCamera } from 'react-icons/fa';

interface ProfileFormProps {
  profile: any;
  onUpdate: () => void;
}

export default function ProfileForm({ profile, onUpdate }: ProfileFormProps) {
  const { data: session } = useSession();
  const toast = useToast();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    fullName: profile?.profileData?.fullName || '',
    phoneNumber: profile?.profileData?.phoneNumber || '',
    address: profile?.profileData?.address || '',
    bio: profile?.profileData?.bio || ''
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // フォーム入力の変更ハンドラ
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // バリデーション
  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    
    // 電話番号のバリデーション（必須ではない）
    if (formData.phoneNumber && !/^[\d\s\-+()]{7,15}$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = '有効な電話番号を入力してください';
    }
    
    // バイオの長さ制限
    if (formData.bio && formData.bio.length > 500) {
      newErrors.bio = '自己紹介は500文字以内で入力してください';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // フォーム送信
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/api/users/profile`,
        {
          profileData: {
            fullName: formData.fullName,
            phoneNumber: formData.phoneNumber,
            address: formData.address,
            bio: formData.bio
          }
        },
        {
          headers: {
            Authorization: `Bearer ${session?.accessToken}`
          }
        }
      );
      
      toast({
        title: '更新完了',
        description: 'プロフィール情報が更新されました',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      // 親コンポーネントの更新関数を呼び出す
      onUpdate();
    } catch (error) {
      console.error('プロフィール更新エラー:', error);
      toast({
        title: 'エラー',
        description: 'プロフィール情報の更新に失敗しました',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // アバター画像の更新
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // 画像の種類をチェック
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'エラー',
        description: '画像ファイルを選択してください',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    // 画像サイズをチェック (5MB以下)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'エラー',
        description: '画像サイズは5MB以下にしてください',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    // FormDataの作成
    const formData = new FormData();
    formData.append('avatar', file);
    
    try {
      setIsSubmitting(true);
      
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/users/avatar`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${session?.accessToken}`
          }
        }
      );
      
      toast({
        title: '更新完了',
        description: 'プロフィール画像が更新されました',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      // 親コンポーネントの更新関数を呼び出す
      onUpdate();
    } catch (error) {
      console.error('アバター更新エラー:', error);
      toast({
        title: 'エラー',
        description: 'プロフィール画像の更新に失敗しました',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <VStack spacing={6} as="form" onSubmit={handleSubmit} align="stretch">
      <Heading as="h2" size="md">プロフィール編集</Heading>
      
      {/* アバター画像アップロード */}
      <Flex justify="center" mb={4}>
        <Box position="relative">
          <Avatar
            size="xl"
            name={profile?.username || session?.user?.name || 'ユーザー'}
            src={profile?.avatar || session?.user?.image || undefined}
            mb={2}
          />
          
          <Box
            position="absolute"
            bottom="-4px"
            right="-4px"
            bg="blue.500"
            borderRadius="full"
            p={2}
            cursor="pointer"
            color="white"
            as="label"
            htmlFor="avatar-upload"
          >
            <FaCamera />
            <input
              id="avatar-upload"
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleAvatarChange}
            />
          </Box>
        </Box>
      </Flex>
      
      <Text textAlign="center" fontSize="sm" color="gray.500" mb={4}>
        画像をクリックして新しいプロフィール画像をアップロード
      </Text>
      
      {/* ユーザー名（表示用） */}
      <FormControl>
        <FormLabel>ユーザー名</FormLabel>
        <Input
          value={profile?.username || ''}
          isReadOnly
          bg="gray.100"
          _dark={{ bg: 'gray.700' }}
        />
      </FormControl>
      
      {/* メールアドレス（表示用） */}
      <FormControl>
        <FormLabel>メールアドレス</FormLabel>
        <Input
          value={profile?.email || ''}
          isReadOnly
          bg="gray.100"
          _dark={{ bg: 'gray.700' }}
        />
      </FormControl>
      
      {/* 以下、編集可能なフィールド */}
      <FormControl isInvalid={!!errors.fullName}>
        <FormLabel>氏名</FormLabel>
        <Input
          name="fullName"
          value={formData.fullName}
          onChange={handleChange}
          placeholder="山田 太郎"
        />
        <FormErrorMessage>{errors.fullName}</FormErrorMessage>
      </FormControl>
      
      <FormControl isInvalid={!!errors.phoneNumber}>
        <FormLabel>電話番号</FormLabel>
        <InputGroup>
          <InputLeftAddon>
            <FaUser />
          </InputLeftAddon>
          <Input
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleChange}
            placeholder="090-1234-5678"
          />
        </InputGroup>
        <FormErrorMessage>{errors.phoneNumber}</FormErrorMessage>
      </FormControl>
      
      <FormControl isInvalid={!!errors.address}>
        <FormLabel>住所</FormLabel>
        <Input
          name="address"
          value={formData.address}
          onChange={handleChange}
          placeholder="東京都渋谷区代々木1-1-1"
        />
        <FormErrorMessage>{errors.address}</FormErrorMessage>
      </FormControl>
      
      <FormControl isInvalid={!!errors.bio}>
        <FormLabel>自己紹介</FormLabel>
        <Textarea
          name="bio"
          value={formData.bio}
          onChange={handleChange}
          placeholder="自己紹介を入力してください..."
          rows={4}
        />
        <FormErrorMessage>{errors.bio}</FormErrorMessage>
        <Text fontSize="xs" color="gray.500" mt={1}>
          {formData.bio.length}/500文字
        </Text>
      </FormControl>
      
      <HStack spacing={4} mt={4}>
        <Button
          type="submit"
          colorScheme="blue"
          isLoading={isSubmitting}
          loadingText="更新中..."
        >
          保存
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            setFormData({
              fullName: profile?.profileData?.fullName || '',
              phoneNumber: profile?.profileData?.phoneNumber || '',
              address: profile?.profileData?.address || '',
              bio: profile?.profileData?.bio || ''
            });
            setErrors({});
          }}
        >
          リセット
        </Button>
      </HStack>
    </VStack>
  );
} 