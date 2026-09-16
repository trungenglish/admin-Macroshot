import {
  BookOpenIcon,
  CarrotIcon,
  LayoutDashboardIcon,
  LifeBuoyIcon,
  LogOutIcon,
  SettingsIcon,
  TestTubeIcon,
  UserIcon,
  UsersIcon,
  UtensilsIcon,
} from 'lucide-react';

export const APP_SIDEBAR = {
  primaryNav: [
    { title: 'Dashboard', url: '#', Icon: LayoutDashboardIcon },
    { title: 'Users', url: '#', Icon: UsersIcon },
    { title: 'Recipes', url: '#', Icon: UtensilsIcon },
    { title: 'Ingredients', url: '#', Icon: CarrotIcon },
    { title: 'Nutrients', url: '/admin/nutrients', Icon: TestTubeIcon },
  ],
  secondaryNav: [
    { title: 'Support', url: '#', Icon: LifeBuoyIcon },
    { title: 'Settings', url: '#', Icon: SettingsIcon },
  ],
  curProfile: {
    src: 'https://randomuser.me/api/portraits/men/47.jpg',
    name: 'To rung',
    email: 'macroshot@gmail.com',
  },
  allProfiles: [
    {
      src: 'https://randomuser.me/api/portraits/men/47.jpg',
      name: 'To rung',
      email: 'macroshot@gmail.com',
    },
    {
      src: 'https://randomuser.me/api/portraits/women/43.jpg',
      name: 'Violet Hicks',
      email: 'violet.hicks@example.com',
    },
  ],
  userMenu: {
    itemsPrimary: [
      { title: 'View profile', url: '#', Icon: UserIcon, kbd: '⌘K->P' },
      {
        title: 'Account settings',
        url: '#',
        Icon: SettingsIcon,
        kbd: '⌘S',
      },
      { title: 'Documentation', url: '#', Icon: BookOpenIcon },
    ],
    itemsSecondary: [
      { title: 'Sign out', url: '#', Icon: LogOutIcon, kbd: '⌥⇧Q' },
    ],
  },
};
