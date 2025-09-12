import { Button, Flex, Stack, Text } from '@chakra-ui/react';
import { lazy, Suspense, useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router';

import { type ExtClientType, getClientDetails } from '@/entities/client';
import { SCREENS, type ScreenType } from '@/shared/config';
import { Container } from '@/shared/ui/container';
import { Preloader } from '@/shared/ui/preloader';

const ClientHeader = lazy(() =>
  import('@/features').then((module) => ({ default: module.ClientHeader })),
);
const EditClient = lazy(() =>
  import('@/features').then((module) => ({ default: module.EditClient })),
);
const DeleteClient = lazy(() =>
  import('@/features').then((module) => ({ default: module.DeleteClient })),
);
const AccountList = lazy(() =>
  import('@/features').then((module) => ({ default: module.AccountList })),
);
const AutoList = lazy(() => import('@/features').then((module) => ({ default: module.AutoList })));

export const ClientDetails = () => {
  const { id } = useParams<{ id: string }>();
  const [client, setClient] = useState<ExtClientType | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const navigate = useNavigate();
  const location = useLocation();
  const fromPage = (location.state as { fromPage?: ScreenType })?.fromPage;

  const refreshClientData = async () => {
    if (!id) {
      return;
    }
    setIsLoading(true);
    getClientDetails(Number(id))
      .then((client) => setClient(client))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    refreshClientData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleBackClick = () => {
    if (fromPage === SCREENS.AutoList) {
      navigate(SCREENS.AutoList);
    } else {
      navigate(SCREENS.ClientList);
    }
  };

  if (isLoading) {
    return (
      <Container>
        <Preloader />
      </Container>
    );
  }

  if (!client) {
    return (
      <Container>
        <Stack backgroundColor="white" rounded="xl" overflow="hidden">
          <Flex p={5} justify="center">
            <Flex
              gap={2}
              maxW={500}
              direction="column"
              align="center"
              justify="center"
              textAlign="center"
            >
              <Text textStyle="3xl" fontWeight="medium">
                Запись не найдена
              </Text>
              <Text textStyle="md">
                К сожалению, данные о выбранном клиенте не найдены. Возможно запись сформирована
                некорректно.
              </Text>
              <Button mt={2} colorPalette="black" rounded="lg" onClick={handleBackClick}>
                Вернуться назад
              </Button>
            </Flex>
          </Flex>
        </Stack>
      </Container>
    );
  }

  return (
    <Container>
      <Suspense fallback={<Preloader />}>
        <ClientHeader data={client} onBackClick={handleBackClick} containerProps={{ mb: 5 }} />
        <EditClient
          data={client}
          handleRefreshData={refreshClientData}
          containerProps={{ mb: 5 }}
        />
        <AutoList data={client} handleRefreshData={refreshClientData} containerProps={{ mb: 5 }} />
        <AccountList data={client} containerProps={{ mb: 5 }} />
        <DeleteClient data={client} />
      </Suspense>
    </Container>
  );
};
