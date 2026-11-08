import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { EllipsisVerticalIcon } from 'lucide-react';
import { DASHBOARD_CARD_MENU } from '@/features/dashboard/dashboard-data';
import { Button } from '@/components/ui/button';

type Props = {
  title: string;
  description: string;
  text?: string;
  buttonText: string;
};

export const DashboardCard = ({
  title,
  description,
  // text,
  buttonText,
  children,
}: React.PropsWithChildren<Props>) => {
  return (
    <Card className='bg-background'>
      <CardHeader className='border-b flex justify-between'>
        <div>
          <CardTitle className='text-lg'>{title}</CardTitle>

          <CardDescription>{description}</CardDescription>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <EllipsisVerticalIcon size={20} />
          </DropdownMenuTrigger>

          <DropdownMenuContent align='end'>
            {DASHBOARD_CARD_MENU.map((item) => (
              <DropdownMenuItem key={item.label}>
                <item.Icon />
                {item.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>

      <CardContent className='grid grid-cols-1 grow'>{children}</CardContent>

      <CardFooter className='border-t'>
        <Button
          variant='outline'
          className='ml-auto'
        >
          {buttonText}
        </Button>
      </CardFooter>
    </Card>
  );
};
