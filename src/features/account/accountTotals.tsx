import { Button, Flex, Stack, type StackProps, Text } from '@chakra-ui/react';

import type { AccountDetailsType } from '@/entities';
import { formatCurrency } from '@/shared/lib';

interface IAccountTotalsProps {
  data: AccountDetailsType;
  totalCosts: {
    totalWorksCost: number;
    totalPartsCost: number;
  };
  containerProps?: StackProps;
}

export const AccountTotals = ({ data, totalCosts, containerProps }: IAccountTotalsProps) => {
  const { totalWorksCost, totalPartsCost } = totalCosts;

  const totalAccountCost = totalWorksCost + totalPartsCost;

  return (
    <Stack
      flexShrink={0}
      backgroundColor="white"
      overflow="hidden"
      rounded="xl"
      {...containerProps}
    >
      <Flex
        direction="row"
        align="center"
        justify="space-between"
        px={5}
        py={4}
        borderBottomWidth="1px"
      >
        <Text textStyle="xl" fontWeight="medium">
          Заключение по счету
        </Text>
      </Flex>
      <Flex p={5} gap={5} flexShrink={0} justify="space-between">
        <Flex direction="column" gap={3} justify="space-between" maxW={500}>
          <Text textStyle="md" color="gray.500" maxW={900}>
            Готовый документ будет сохранён в выбранной вами папке — система откроет окно выбора
            автоматически.
          </Text>
          <Button w="fit" size="md" rounded="lg" colorPalette="blue" disabled>
            Сформировать "Заказ-наряд"
          </Button>
        </Flex>
        <Flex direction="column" justify="space-between" gap={5} minW={400}>
          <Flex direction="column" gap={3}>
            <Flex direction="row" justify="flex-end" textAlign="end" align="center" gap={3}>
              <Text textStyle="sm">Итого по работам:</Text>
              <Stack borderWidth={1} px={3}>
                <Text textStyle="sm" fontWeight="medium">
                  {formatCurrency(totalWorksCost)}
                </Text>
              </Stack>
            </Flex>
            <Flex direction="row" justify="flex-end" textAlign="end" align="center" gap={3}>
              <Text textStyle="sm">Итого по запчастям:</Text>
              <Stack borderWidth={1} px={3}>
                <Text textStyle="sm" fontWeight="medium">
                  {formatCurrency(totalPartsCost)}
                </Text>
              </Stack>
            </Flex>
          </Flex>
          <Flex direction="row" justify="flex-end" textAlign="end" align="center" gap={3}>
            <Text textStyle="lg" fontWeight="medium">
              Всего по счету:
            </Text>
            <Stack borderWidth={1} px={3}>
              <Text textStyle="lg" fontWeight="medium">
                {formatCurrency(totalAccountCost)}
              </Text>
            </Stack>
          </Flex>
        </Flex>
      </Flex>
    </Stack>
  );
};
