export type RouteMeta = {
  title?: string;
  description?: string;
  publicRoute?: boolean;
  layout?: 'blank' | 'navigation';
  restricted?: boolean;
  action?: string;
  resource?: string;
};

export type AppRoute = {
  path: string;
  element: React.ReactNode;
  meta?: RouteMeta;
};
