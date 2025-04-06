import React from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Divider,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Alert,
  AlertIcon,
  Button,
  Flex,
} from '@chakra-ui/react';
import Link from 'next/link';
import Layout from '@/components/Layout';

const FaqPage = () => {
  // FAQデータ
  const faqData = {
    purchase: [
      {
        question: '商品の購入方法を教えてください',
        answer:
          '商品詳細ページの「カートに追加」ボタンをクリックし、カートページから購入手続きに進みます。お支払い情報を入力し、「注文確定」ボタンをクリックすると購入が完了します。購入完了後、登録メールアドレスに確認メールが送信されます。',
      },
      {
        question: '対応している支払い方法は何ですか？',
        answer:
          '当ショップでは、クレジットカード（Visa, MasterCard, American Express, JCB）、PayPal、銀行振込に対応しています。クレジットカードと PayPal での支払いは即時処理され、銀行振込の場合は入金確認後に商品が提供されます。',
      },
      {
        question: '領収書は発行できますか？',
        answer:
          'はい、ご購入後にマイページの注文履歴から領収書をダウンロードできます。法人のお客様で宛名や但し書きの指定が必要な場合は、お問い合わせフォームからご連絡ください。',
      },
    ],
    account: [
      {
        question: 'アカウント登録は必須ですか？',
        answer:
          'はい、デジタル商品を安全に提供するためにアカウント登録が必要です。登録は簡単で、メールアドレスとパスワードのみで完了します。アカウントを作成することで、購入履歴の確認や再ダウンロードも可能になります。',
      },
      {
        question: 'パスワードを忘れてしまいました',
        answer:
          'ログインページの「パスワードをお忘れですか？」リンクをクリックして、登録しているメールアドレスを入力してください。パスワードリセット用のリンクが記載されたメールが送信されます。',
      },
      {
        question: 'アカウントを削除したいです',
        answer:
          'アカウント削除をご希望の場合は、マイページの設定画面から削除手続きを行うか、お問い合わせフォームからご連絡ください。なお、アカウントを削除すると購入履歴や商品へのアクセス権も失われますのでご注意ください。',
      },
    ],
    products: [
      {
        question: '購入した商品はどうやってダウンロードできますか？',
        answer:
          '購入完了後、マイページの「購入商品」セクションからダウンロードできます。また、購入完了メールにもダウンロードリンクが記載されています。ダウンロードリンクはアカウントにログインしている状態でのみ有効です。',
      },
      {
        question: 'ダウンロードの期限はありますか？',
        answer:
          '基本的にダウンロード期限はなく、購入後はいつでもマイページから再ダウンロードが可能です。ただし、一部の期間限定商品や、メンテナンス終了した製品については再ダウンロードできない場合があります。詳細は各商品の説明ページをご確認ください。',
      },
      {
        question: '商品のアップデートはありますか？',
        answer:
          'はい、多くの商品は定期的にアップデートされます。アップデートがある場合は、登録メールアドレスにお知らせが送信され、マイページから最新版をダウンロードできます。アップデート頻度は商品によって異なります。',
      },
    ],
    refunds: [
      {
        question: 'デジタル商品の返金は可能ですか？',
        answer:
          'デジタルコンテンツの性質上、原則として返品・返金はお受けしておりませんが、商品に重大な不具合がある場合や、商品説明と著しく異なる場合は個別に対応いたします。詳細は返品・交換ポリシーをご確認ください。',
      },
      {
        question: '商品に不具合がある場合はどうすればいいですか？',
        answer:
          '商品に不具合を発見された場合は、お問い合わせフォームから具体的な症状をお知らせください。できるだけ詳細な情報（環境、発生状況、スクリーンショットなど）をご提供いただくと、迅速な対応が可能です。多くの場合、修正版の提供や代替品の案内で対応しています。',
      },
      {
        question: '同じ商品を誤って2回購入してしまいました',
        answer:
          '同一アカウントでの重複購入が確認できた場合、購入から7日以内であれば返金対応が可能です。お問い合わせフォームから注文番号を添えてご連絡ください。返金処理には5〜10営業日ほどかかる場合があります。',
      },
    ],
    payment: [
      {
        question: '海外からも購入できますか？',
        answer:
          'はい、海外からもご購入いただけます。当ショップは国際的な決済方法に対応しており、世界中のお客様にサービスを提供しています。ただし、一部の国や地域では利用できない場合がありますのでご了承ください。',
      },
      {
        question: '請求先情報と配送先情報は異なっていても大丈夫ですか？',
        answer:
          'デジタル商品のため配送は行いませんが、請求書の宛先は自由に設定していただけます。クレジットカード情報の名義と異なる場合でも問題ありません。法人のお客様で特定の宛名が必要な場合は、注文時に備考欄にご記入ください。',
      },
      {
        question: '支払い後、商品が届きません',
        answer:
          '支払い完了後、通常は数分以内にメールが届き、マイページから商品がダウンロード可能になります。メールが届かない場合は、迷惑メールフォルダをご確認いただくか、マイページにログインして注文状況をご確認ください。問題が解決しない場合は、お問い合わせフォームからご連絡ください。',
      },
    ],
  };

  return (
    <Layout>
      <Container maxW="container.lg" py={8}>
        <VStack spacing={8} align="stretch">
          <Box textAlign="center" mb={6}>
            <Heading as="h1" size="xl" mb={4}>よくある質問</Heading>
            <Text fontSize="lg" color="gray.500">
              よくお寄せいただく質問とその回答をまとめました
            </Text>
          </Box>

          <Alert status="info" borderRadius="md" mb={4}>
            <AlertIcon />
            <Box>
              <Text fontWeight="bold">お探しの回答が見つからない場合</Text>
              <Text>
                こちらに掲載されていない質問については、お問い合わせフォームからお気軽にご連絡ください。
              </Text>
            </Box>
          </Alert>

          <Tabs variant="enclosed" colorScheme="blue" isLazy>
            <TabList>
              <Tab>購入について</Tab>
              <Tab>アカウントについて</Tab>
              <Tab>商品について</Tab>
              <Tab>返金・交換について</Tab>
              <Tab>お支払いについて</Tab>
            </TabList>

            <TabPanels>
              <TabPanel>
                <Accordion allowToggle>
                  {faqData.purchase.map((faq, index) => (
                    <AccordionItem key={index}>
                      <h2>
                        <AccordionButton py={4}>
                          <Box flex="1" textAlign="left" fontWeight="medium">
                            {faq.question}
                          </Box>
                          <AccordionIcon />
                        </AccordionButton>
                      </h2>
                      <AccordionPanel pb={4}>
                        {faq.answer}
                      </AccordionPanel>
                    </AccordionItem>
                  ))}
                </Accordion>
              </TabPanel>

              <TabPanel>
                <Accordion allowToggle>
                  {faqData.account.map((faq, index) => (
                    <AccordionItem key={index}>
                      <h2>
                        <AccordionButton py={4}>
                          <Box flex="1" textAlign="left" fontWeight="medium">
                            {faq.question}
                          </Box>
                          <AccordionIcon />
                        </AccordionButton>
                      </h2>
                      <AccordionPanel pb={4}>
                        {faq.answer}
                      </AccordionPanel>
                    </AccordionItem>
                  ))}
                </Accordion>
              </TabPanel>

              <TabPanel>
                <Accordion allowToggle>
                  {faqData.products.map((faq, index) => (
                    <AccordionItem key={index}>
                      <h2>
                        <AccordionButton py={4}>
                          <Box flex="1" textAlign="left" fontWeight="medium">
                            {faq.question}
                          </Box>
                          <AccordionIcon />
                        </AccordionButton>
                      </h2>
                      <AccordionPanel pb={4}>
                        {faq.answer}
                      </AccordionPanel>
                    </AccordionItem>
                  ))}
                </Accordion>
              </TabPanel>

              <TabPanel>
                <Accordion allowToggle>
                  {faqData.refunds.map((faq, index) => (
                    <AccordionItem key={index}>
                      <h2>
                        <AccordionButton py={4}>
                          <Box flex="1" textAlign="left" fontWeight="medium">
                            {faq.question}
                          </Box>
                          <AccordionIcon />
                        </AccordionButton>
                      </h2>
                      <AccordionPanel pb={4}>
                        {faq.answer}
                      </AccordionPanel>
                    </AccordionItem>
                  ))}
                </Accordion>
              </TabPanel>

              <TabPanel>
                <Accordion allowToggle>
                  {faqData.payment.map((faq, index) => (
                    <AccordionItem key={index}>
                      <h2>
                        <AccordionButton py={4}>
                          <Box flex="1" textAlign="left" fontWeight="medium">
                            {faq.question}
                          </Box>
                          <AccordionIcon />
                        </AccordionButton>
                      </h2>
                      <AccordionPanel pb={4}>
                        {faq.answer}
                      </AccordionPanel>
                    </AccordionItem>
                  ))}
                </Accordion>
              </TabPanel>
            </TabPanels>
          </Tabs>

          <Divider my={8} />

          <Box>
            <Heading as="h2" size="lg" mb={4}>他にご質問がある場合</Heading>
            <Text mb={6}>
              上記の質問で解決しなかった場合は、お問い合わせフォームからご連絡ください。通常2営業日以内にご返答いたします。
            </Text>
            <Flex justifyContent="center">
              <Link href="/contact" passHref>
                <Button colorScheme="blue" size="lg">
                  お問い合わせフォームへ
                </Button>
              </Link>
            </Flex>
          </Box>
        </VStack>
      </Container>
    </Layout>
  );
};

export default FaqPage; 