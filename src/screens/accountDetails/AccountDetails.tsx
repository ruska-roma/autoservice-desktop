import { Button, Flex, Stack, Text } from '@chakra-ui/react';
import { lazy, Suspense, useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router';

import { type AccountDetailsType, getAccountDetails } from '@/entities';
import { SCREENS, type ScreenType } from '@/shared/config';
import { Container, Preloader } from '@/shared/ui';

const EditAccount = lazy(() =>
  import('@/features').then((module) => ({ default: module.EditAccount })),
);
const DeleteAccount = lazy(() =>
  import('@/features').then((module) => ({ default: module.DeleteAccount })),
);
const AccountHeader = lazy(() =>
  import('@/features').then((module) => ({ default: module.AccountHeader })),
);
const AccountTotals = lazy(() =>
  import('@/features').then((module) => ({ default: module.AccountTotals })),
);
const WorkList = lazy(() => import('@/features').then((module) => ({ default: module.WorkList })));
const PartList = lazy(() => import('@/features').then((module) => ({ default: module.PartList })));

export function AccountDetails() {
  const { id } = useParams<{ id: string }>();
  const [account, setAccount] = useState<AccountDetailsType | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const navigate = useNavigate();
  const location = useLocation();

  const fromPage = (location.state as { fromPage?: ScreenType })?.fromPage;
  const clientId = (location.state as { clientId?: number })?.clientId;

  const handleBackClick = () => {
    switch (fromPage) {
      case SCREENS.AccountList:
        navigate(SCREENS.AccountList);
        break;
      case SCREENS.ClientDetails:
        if (clientId) {
          navigate(`/client/${clientId}`, { state: { fromPage: SCREENS.AccountList } });
        } else {
          navigate(SCREENS.ClientList);
        }
        break;
      default:
        navigate(SCREENS.ClientList);
    }
  };

  const refreshAccountData = async () => {
    if (!id) {
      return;
    }
    setIsLoading(true);
    getAccountDetails(Number(id))
      .then((account) => setAccount(account))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    refreshAccountData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (isLoading) {
    return (
      <Container>
        <Preloader />
      </Container>
    );
  }

  if (!account) {
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
                К сожалению, данные о выбранном счете не найдены. Возможно запись сформирована
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

  const isWorksExist = account.works.length > 0;
  const isPartsExist = account.parts.length > 0;

  const isDependencyDataExists = !!isWorksExist || !!isPartsExist;

  const totalWorksCost = account.works.reduce((acc, w) => acc + (w.total_work_cost ?? 0), 0);
  const totalPartsCost = account.parts.reduce((acc, p) => acc + (p.total_part_cost ?? 0), 0);

  return (
    <Container>
      <Suspense fallback={<Preloader />}>
        <AccountHeader data={account} onBackClick={handleBackClick} containerProps={{ mb: 5 }} />
        <EditAccount
          data={account}
          handleRefreshData={refreshAccountData}
          containerProps={{ mb: 5 }}
        />
        <WorkList
          data={account}
          isDataExists={isWorksExist}
          totalWorksCost={totalWorksCost}
          handleRefreshData={refreshAccountData}
          containerProps={{ mb: 5 }}
        />
        <PartList
          data={account}
          isDataExists={isPartsExist}
          totalPartsCost={totalPartsCost}
          handleRefreshData={refreshAccountData}
          containerProps={{ mb: 5 }}
        />
        {!!isDependencyDataExists && (
          <AccountTotals
            data={account}
            totalCosts={{ totalWorksCost, totalPartsCost }}
            containerProps={{ mb: 5 }}
          />
        )}
        <DeleteAccount data={account} />
      </Suspense>
    </Container>
  );
}
