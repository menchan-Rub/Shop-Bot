import React, { useEffect, useState } from 'react';
import { Container, Box, Heading, Text, Spinner, VStack } from '@chakra-ui/react';
import Layout from '../components/Layout';
import ReactMarkdown from 'react-markdown';

const DisclaimerPage = () => {
  const [markdown, setMarkdown] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // マークダウンファイルを読み込む
    fetch('/api/legal/disclaimer')
      .then(response => response.text())
      .then(data => {
        setMarkdown(data);
        setLoading(false);
      })
      .catch(error => {
        console.error('免責事項の読み込みに失敗しました:', error);
        setLoading(false);
      });
  }, []);

  return (
    <Layout>
      <Container maxW="container.lg" py={8}>
        {loading ? (
          <Box textAlign="center" py={10}>
            <Spinner size="xl" />
          </Box>
        ) : (
          <VStack spacing={6} align="stretch">
            <Box>
              <ReactMarkdown>{markdown}</ReactMarkdown>
            </Box>
          </VStack>
        )}
      </Container>
    </Layout>
  );
};

export default DisclaimerPage; 