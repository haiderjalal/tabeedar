import { HomeRedirect } from '@/features/auth/components/home-redirect';

/** Entry route: decides where to send the person based on whether and how they are signed in. */
export default function IndexRoute() {
  return <HomeRedirect />;
}
