import {
  ButtonGroup,
  IconButton,
  Pagination as UIPagination,
  type PaginationRootProps,
} from '@chakra-ui/react';
import { LuChevronLeft, LuChevronRight } from 'react-icons/lu';

import type { SizeEnum } from '@/shared/types';

interface IPaginationProps {
  rootProps: PaginationRootProps;
  size?: SizeEnum;
}

export function Pagination({ rootProps, size = 'md' }: IPaginationProps) {
  return (
    <UIPagination.Root {...rootProps}>
      <ButtonGroup size={size} variant="ghost">
        <UIPagination.PrevTrigger asChild>
          <IconButton>
            <LuChevronLeft />
          </IconButton>
        </UIPagination.PrevTrigger>
        <UIPagination.Items
          render={(page) => (
            <IconButton variant={{ base: 'outline', _selected: 'solid' }}>{page.value}</IconButton>
          )}
        />
        <UIPagination.NextTrigger asChild>
          <IconButton>
            <LuChevronRight />
          </IconButton>
        </UIPagination.NextTrigger>
      </ButtonGroup>
    </UIPagination.Root>
  );
}
