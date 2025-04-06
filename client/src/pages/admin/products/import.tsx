import { useState, useRef } from 'react';
import {
  Box, Container, Heading, Text, Button, VStack, HStack, useToast,
  FormControl, FormLabel, Input, Alert, AlertIcon, Table,
  Thead, Tbody, Tr, Th, Td, Progress, useColorModeValue,
  List, ListItem, ListIcon, Modal, ModalOverlay, ModalContent,
  ModalHeader, ModalBody, ModalFooter, useDisclosure,
  Badge, Code, Divider, Flex, Spinner, Link
} from '@chakra-ui/react';
import { useRouter } from 'next/router';
import axios from 'axios';
import { FaFileUpload, FaCheck, FaExclamationTriangle, FaDownload, FaArrowLeft } from 'react-icons/fa';
import { MdCheckCircle, MdError } from 'react-icons/md';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminGuard from '@/components/admin/AdminGuard';

interface ParsedProduct {
  _id?: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  status: string;
  categoryId?: string;
  categoryName?: string;
  images?: string[];
  [key: string]: any; // インデックスシグネチャ
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  data: ParsedProduct;
}

const ProductImport = () => {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedProduct[]>([]);
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState<{ success: number; failed: number; errors: string[] }>({
    success: 0,
    failed: 0,
    errors: []
  });
  const [progress, setProgress] = useState(0);
  const [categories, setCategories] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  // カラーモード
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const codeBg = useColorModeValue('gray.50', 'gray.700');

  // CSVテンプレートをダウンロード
  const downloadTemplate = () => {
    const headers = ['name', 'description', 'price', 'stock', 'status', 'categoryId', 'categoryName', 'images'];
    const sampleData = [
      ['商品名サンプル', '商品説明サンプル', '1000', '10', 'available', '', 'カテゴリー名', 'https://example.com/image.jpg'],
      ['別の商品名', '別の商品説明', '2000', '5', 'hidden', '', 'カテゴリー名', '']
    ];
    
    const csvContent = [
      headers.join(','),
      ...sampleData.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const filename = `products-template-${timestamp}.csv`;
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: 'テンプレートダウンロード完了',
      description: `CSVテンプレートファイル "${filename}" のダウンロードを開始しました`,
      status: 'info',
      duration: 3000,
      isClosable: true,
    });
  };

  // ファイル選択時の処理
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
        toast({
          title: 'エラー',
          description: 'CSVファイルを選択してください',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }
      
      setFile(selectedFile);
      parseCSV(selectedFile);
    }
  };

  // CSVファイルをパース
  const parseCSV = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const lines = content.split('\n');
        const headers = lines[0].split(',').map(header => header.trim());
        
        const products: ParsedProduct[] = [];
        
        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue;
          
          const values = parseCSVLine(lines[i]);
          if (values.length !== headers.length) {
            toast({
              title: '形式エラー',
              description: `行 ${i+1} の列数がヘッダーと一致しません`,
              status: 'error',
              duration: 3000,
              isClosable: true,
            });
            continue;
          }
          
          const product: any = {};
          headers.forEach((header, idx) => {
            product[header] = values[idx];
          });
          
          // 数値フィールドを変換
          if (product.price) product.price = parseFloat(product.price);
          if (product.stock) product.stock = parseInt(product.stock);
          
          // 画像URLが指定されている場合は配列に変換
          if (product.images) {
            product.images = product.images.split('|').filter(Boolean).map((url: string) => url.trim());
          } else {
            product.images = [];
          }
          
          products.push(product);
        }
        
        setParsedData(products);
        validateProducts(products);
        
      } catch (error) {
        console.error('CSVパースエラー:', error);
        toast({
          title: 'CSVパースエラー',
          description: 'CSVファイルの解析に失敗しました',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    };
    
    reader.readAsText(file);
  };

  // CSVの行を適切にパース（カンマ内のクォーテーションを考慮）
  const parseCSVLine = (line: string): string[] => {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    
    // 最後の値を追加
    result.push(current);
    
    // 前後のダブルクォーテーションを削除
    return result.map(value => {
      if (value.startsWith('"') && value.endsWith('"')) {
        return value.substring(1, value.length - 1).replace(/""/g, '"');
      }
      return value;
    });
  };

  // 商品データのバリデーション
  const validateProducts = async (products: ParsedProduct[]) => {
    try {
      // カテゴリー一覧を取得
      const token = localStorage.getItem('adminToken');
      if (!token) {
        throw new Error('管理者トークンがありません');
      }
      
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/categories`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      setCategories(response.data);
      
      // 各商品のバリデーション
      const results = products.map(product => validateProduct(product, response.data));
      setValidationResults(results);
    } catch (error) {
      console.error('バリデーションエラー:', error);
      toast({
        title: 'バリデーションエラー',
        description: '商品データの検証に失敗しました',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // 個別商品のバリデーション
  const validateProduct = (product: ParsedProduct, categories: any[]): ValidationResult => {
    const errors: string[] = [];
    
    // 必須フィールドのチェック
    if (!product.name) {
      errors.push('商品名は必須です');
    }
    
    if (isNaN(product.price) || product.price < 0) {
      errors.push('価格は0以上の数値である必要があります');
    }
    
    if (isNaN(product.stock) || product.stock < 0) {
      errors.push('在庫数は0以上の数値である必要があります');
    }
    
    // ステータスの検証
    const validStatuses = ['available', 'out_of_stock', 'hidden'];
    if (!validStatuses.includes(product.status)) {
      errors.push(`ステータスは ${validStatuses.join(', ')} のいずれかである必要があります`);
      // デフォルト値を設定
      product.status = 'hidden';
    }
    
    // カテゴリーの検証
    if (product.categoryId || product.categoryName) {
      if (product.categoryId) {
        const category = categories.find(c => c._id === product.categoryId);
        if (!category) {
          errors.push(`指定されたカテゴリーID ${product.categoryId} は存在しません`);
          delete product.categoryId;
        }
      } else if (product.categoryName) {
        const category = categories.find(c => c.name === product.categoryName);
        if (category) {
          product.categoryId = category._id;
        } else {
          errors.push(`指定されたカテゴリー名 ${product.categoryName} は存在しません`);
        }
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      data: product
    };
  };

  // インポート実行
  const handleImport = async () => {
    // 有効なデータのみをインポート
    const validProducts = validationResults.filter(result => result.isValid).map(result => result.data);
    
    if (validProducts.length === 0) {
      toast({
        title: 'インポートエラー',
        description: 'インポートする有効なデータがありません',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    setImporting(true);
    setProgress(0);
    setImportResults({ success: 0, failed: 0, errors: [] });
    
    // 認証トークン取得
    const token = localStorage.getItem('adminToken');
    if (!token) {
      setImporting(false);
      toast({
        title: 'エラー',
        description: '認証トークンがありません。再ログインしてください。',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    
    let successCount = 0;
    let failedCount = 0;
    const errors: string[] = [];
    
    for (let i = 0; i < validProducts.length; i++) {
      try {
        const product = validProducts[i];
        const { name, description, price, stock, status, categoryId, images } = product;
        
        // カテゴリー設定
        const category = categoryId ? { _id: categoryId } : undefined;
        
        // 商品データを作成
        const productData = {
          name,
          description,
          price,
          stock,
          status,
          category,
          images
        };
        
        // APIリクエスト
        await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/api/products`,
          productData,
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
          }
        );
        
        successCount++;
      } catch (error: any) {
        console.error('商品インポートエラー:', error);
        failedCount++;
        errors.push(`商品 ${validProducts[i].name}: ${error.response?.data?.message || error.message}`);
      }
      
      // 進捗状況を更新
      setProgress(Math.round(((i + 1) / validProducts.length) * 100));
      setImportResults({
        success: successCount,
        failed: failedCount,
        errors
      });
    }
    
    setImporting(false);
    
    // 結果に応じてメッセージを表示
    if (successCount > 0) {
      toast({
        title: 'インポート完了',
        description: `${successCount}件の商品をインポートしました${failedCount > 0 ? `（${failedCount}件失敗）` : ''}`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } else {
      toast({
        title: 'インポート失敗',
        description: 'すべての商品のインポートに失敗しました',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
    
    // インポートに失敗したものがあれば詳細を表示
    if (failedCount > 0) {
      onOpen();
    }
  };

  return (
    <AdminGuard>
      <AdminLayout>
        <Container maxW="container.xl" py={8}>
          <Box mb={8}>
            <Flex justifyContent="space-between" alignItems="center" mb={4}>
              <Box>
                <Heading as="h1" size="xl">商品インポート</Heading>
                <Text color="gray.500" mt={1}>
                  CSVファイルから商品データを一括インポート
                </Text>
              </Box>
              <HStack>
                <Button
                  leftIcon={<FaArrowLeft />}
                  variant="outline"
                  onClick={() => router.push('/admin/products')}
                >
                  商品一覧へ戻る
                </Button>
                <Button
                  leftIcon={<FaDownload />}
                  colorScheme="teal"
                  onClick={downloadTemplate}
                >
                  CSVテンプレート
                </Button>
              </HStack>
            </Flex>
            
            <Box
              bg={bgColor}
              borderWidth="1px"
              borderRadius="lg"
              borderColor={borderColor}
              p={6}
              mb={8}
            >
              <VStack spacing={5} align="stretch">
                <Alert status="info" borderRadius="md">
                  <AlertIcon />
                  <Box>
                    <Text fontWeight="bold">インポート手順:</Text>
                    <List spacing={1} mt={1}>
                      <ListItem>
                        <ListIcon as={MdCheckCircle} color="green.500" />
                        CSVテンプレートをダウンロードして編集します
                      </ListItem>
                      <ListItem>
                        <ListIcon as={MdCheckCircle} color="green.500" />
                        商品データを入力し、CSVファイルを保存します
                      </ListItem>
                      <ListItem>
                        <ListIcon as={MdCheckCircle} color="green.500" />
                        ファイルを選択して、インポートを実行します
                      </ListItem>
                    </List>
                  </Box>
                </Alert>
                
                <FormControl>
                  <FormLabel>CSVファイルを選択</FormLabel>
                  <Input
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    ref={fileInputRef}
                    h="auto"
                    py={1}
                  />
                </FormControl>
                
                {file && (
                  <Alert status="success" borderRadius="md">
                    <AlertIcon />
                    <Box>
                      <Text fontWeight="bold">選択したファイル:</Text>
                      <Text>{file.name} ({Math.round(file.size / 1024)} KB)</Text>
                    </Box>
                  </Alert>
                )}
                
                {parsedData.length > 0 && (
                  <Alert
                    status={validationResults.some(result => !result.isValid) ? "warning" : "success"}
                    borderRadius="md"
                  >
                    <AlertIcon />
                    <Box>
                      <Text fontWeight="bold">
                        {parsedData.length}件の商品データが読み込まれました
                      </Text>
                      <Text>
                        有効: {validationResults.filter(r => r.isValid).length}件、
                        エラー: {validationResults.filter(r => !r.isValid).length}件
                      </Text>
                    </Box>
                  </Alert>
                )}
                
                {validationResults.length > 0 && (
                  <Box mt={2}>
                    <Button
                      colorScheme="blue"
                      leftIcon={<FaFileUpload />}
                      isLoading={importing}
                      loadingText="インポート中..."
                      isDisabled={validationResults.filter(r => r.isValid).length === 0}
                      onClick={handleImport}
                      mb={4}
                    >
                      {validationResults.filter(r => r.isValid).length}件をインポート
                    </Button>
                    
                    {importing && (
                      <Box mt={2}>
                        <Text mb={2}>インポート中... {progress}%</Text>
                        <Progress value={progress} colorScheme="blue" hasStripe size="sm" mb={2} />
                        <Flex justify="space-between">
                          <Text color="green.500">成功: {importResults.success}件</Text>
                          <Text color="red.500">失敗: {importResults.failed}件</Text>
                        </Flex>
                      </Box>
                    )}
                  </Box>
                )}
              </VStack>
            </Box>
            
            {validationResults.length > 0 && (
              <Box
                bg={bgColor}
                borderWidth="1px"
                borderRadius="lg"
                borderColor={borderColor}
                overflow="hidden"
                mb={8}
              >
                <Heading size="md" p={4} bg={useColorModeValue('gray.50', 'gray.700')}>
                  バリデーション結果
                </Heading>
                <Box overflowX="auto">
                  <Table variant="simple">
                    <Thead>
                      <Tr>
                        <Th>ステータス</Th>
                        <Th>商品名</Th>
                        <Th>価格</Th>
                        <Th>在庫</Th>
                        <Th>カテゴリー</Th>
                        <Th>エラー</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {validationResults.map((result, index) => (
                        <Tr key={index}>
                          <Td>
                            <Badge colorScheme={result.isValid ? "green" : "red"}>
                              {result.isValid ? "有効" : "エラー"}
                            </Badge>
                          </Td>
                          <Td>{result.data.name || '名称なし'}</Td>
                          <Td isNumeric>{isNaN(result.data.price) ? '無効' : result.data.price.toLocaleString()}</Td>
                          <Td isNumeric>{isNaN(result.data.stock) ? '無効' : result.data.stock.toLocaleString()}</Td>
                          <Td>
                            {result.data.categoryId ? (
                              categories.find(c => c._id === result.data.categoryId)?.name || '不明なカテゴリー'
                            ) : (
                              result.data.categoryName || '-'
                            )}
                          </Td>
                          <Td>
                            {result.errors.length > 0 ? (
                              <VStack align="start" spacing={1}>
                                {result.errors.map((error, i) => (
                                  <Text key={i} color="red.500" fontSize="sm">
                                    <Icon as={FaExclamationTriangle} mr={1} />
                                    {error}
                                  </Text>
                                ))}
                              </VStack>
                            ) : (
                              <Icon as={FaCheck} color="green.500" />
                            )}
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </Box>
              </Box>
            )}
            
            <Box
              bg={bgColor}
              borderWidth="1px"
              borderRadius="lg"
              borderColor={borderColor}
              p={6}
            >
              <Heading size="md" mb={4}>CSVファイル仕様</Heading>
              <Text mb={4}>
                商品情報をCSV形式で用意してください。1行目にはヘッダー行として列名を記載し、2行目以降に商品データを記載します。
              </Text>
              
              <Heading size="sm" mb={2}>必須項目</Heading>
              <List spacing={2} mb={4}>
                <ListItem>
                  <Text as="span" fontWeight="bold">name:</Text> 商品名
                </ListItem>
                <ListItem>
                  <Text as="span" fontWeight="bold">price:</Text> 価格（数値）
                </ListItem>
                <ListItem>
                  <Text as="span" fontWeight="bold">stock:</Text> 在庫数（数値）
                </ListItem>
                <ListItem>
                  <Text as="span" fontWeight="bold">status:</Text> ステータス（available, out_of_stock, hiddenのいずれか）
                </ListItem>
              </List>
              
              <Heading size="sm" mb={2}>オプション項目</Heading>
              <List spacing={2} mb={4}>
                <ListItem>
                  <Text as="span" fontWeight="bold">description:</Text> 商品説明
                </ListItem>
                <ListItem>
                  <Text as="span" fontWeight="bold">categoryId:</Text> カテゴリーID
                </ListItem>
                <ListItem>
                  <Text as="span" fontWeight="bold">categoryName:</Text> カテゴリー名
                </ListItem>
                <ListItem>
                  <Text as="span" fontWeight="bold">images:</Text> 画像URL（複数ある場合は | で区切る）
                </ListItem>
              </List>
              
              <Heading size="sm" mb={2}>CSVサンプル</Heading>
              <Box 
                bg={codeBg} 
                p={4} 
                borderRadius="md" 
                fontFamily="monospace" 
                fontSize="sm" 
                overflowX="auto"
              >
                <Code>
                  name,description,price,stock,status,categoryId,categoryName,images<br />
                  "商品名サンプル","商品説明サンプル",1000,10,available,,"カテゴリー名","https://example.com/image.jpg"<br />
                  "別の商品名","別の商品説明",2000,5,hidden,,"カテゴリー名",""
                </Code>
              </Box>
            </Box>
          </Box>
        </Container>
        
        {/* エラー詳細モーダル */}
        <Modal isOpen={isOpen} onClose={onClose} size="xl">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>インポートエラー詳細</ModalHeader>
            <ModalBody>
              <Text mb={4}>以下の商品でインポートエラーが発生しました：</Text>
              <VStack align="start" spacing={3} maxH="400px" overflowY="auto">
                {importResults.errors.map((error, index) => (
                  <Box key={index} p={3} borderWidth="1px" borderRadius="md" w="100%">
                    <Text color="red.500">{error}</Text>
                  </Box>
                ))}
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button colorScheme="blue" onClick={onClose}>
                閉じる
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </AdminLayout>
    </AdminGuard>
  );
};

export default ProductImport; 