import { Flex, Icon, Stack, Text } from '@chakra-ui/react';
import {
  PiBriefcaseDuotone,
  PiBuildingsDuotone,
  PiCarDuotone,
  PiLockKeyDuotone,
  PiUserCircleDuotone,
} from 'react-icons/pi';
import { NavLink } from 'react-router';

import { SCREENS } from '@/shared/config';
import { useAuth } from '@/shared/context';

const ACTIONS_MAP = [
  {
    path: SCREENS.ClientList,
    label: 'Клиенты',
    icon: <PiUserCircleDuotone />,
  },
  {
    path: SCREENS.AutoList,
    label: 'Автомобили',
    icon: <PiCarDuotone />,
  },
  {
    path: SCREENS.AccountList,
    label: 'Счета и работы',
    icon: <PiBriefcaseDuotone />,
  },
  {
    path: SCREENS.Settings,
    label: 'Организация',
    icon: <PiBuildingsDuotone />,
  },
];

export function Navigation() {
  const { setIsAuth } = useAuth();

  return (
    <Stack h="full" w="full" backgroundColor="white" rounded="2xl" p={5}>
      <Flex h="full" direction="column" justify="space-between" px={2}>
        <Stack>
          <Stack mt={2} mb={5}>
            <img src="./logo.svg" alt="Autoservice Logo" />
          </Stack>
          <Flex direction="column" gap={1}>
            {ACTIONS_MAP.map(({ path, label, icon }) => (
              <NavLink key={path} to={path}>
                {({ isActive }) => (
                  <Flex
                    py={2}
                    gap={3}
                    rounded="lg"
                    align="center"
                    cursor="pointer"
                    transition="all 0.1s ease-in-out"
                    color={isActive ? 'gray.500' : 'black'}
                  >
                    {icon && <Icon size="md">{icon}</Icon>}
                    <Text textStyle="md">{label}</Text>
                  </Flex>
                )}
              </NavLink>
            ))}
          </Flex>
        </Stack>
        <Stack>
          <Flex
            py={2}
            gap={3}
            rounded="lg"
            align="center"
            cursor="pointer"
            onClick={() => setIsAuth(false)}
          >
            <Icon size="md">
              <PiLockKeyDuotone />
            </Icon>
            <Text textStyle="md">Заблокировать</Text>
          </Flex>
        </Stack>
      </Flex>
    </Stack>
  );
}
