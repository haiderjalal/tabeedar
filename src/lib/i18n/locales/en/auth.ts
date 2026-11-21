/** English strings for signing in, signing up and the signed-in account. */
export const auth = {
  roles: {
    customer: {
      title: 'I want to order',
      description: 'Browse stores and get things delivered to you.',
    },
    store: {
      title: 'I own a store',
      description: 'Sell your products and manage incoming orders.',
    },
    rider: {
      title: 'I want to deliver',
      description: 'Deliver orders from nearby stores. New riders are approved before they start.',
    },
  },
  signIn: {
    title: 'Welcome back',
    subtitle: 'Sign in to continue.',
    submit: 'Sign in',
    noAccount: 'New to Tabeedar?',
    goToSignUp: 'Create an account',
  },
  signUp: {
    title: 'Create your account',
    subtitle: 'Tell us how you will use Tabeedar.',
    roleLabel: 'Account type',
    submit: 'Create account',
    haveAccount: 'Already have an account?',
    goToSignIn: 'Sign in',
    confirmEmail: {
      title: 'Check your email',
      body: 'We sent a confirmation link to {{email}}. Open it, then sign in.',
      goToSignIn: 'Go to sign in',
    },
  },
  fields: {
    fullName: { label: 'Full name' },
    phone: { label: 'Phone number', hint: 'For example 0300 1234567' },
    email: { label: 'Email' },
    password: {
      label: 'Password',
      hint: 'At least {{min}} characters',
      show: 'Show',
      hide: 'Hide',
    },
  },
  validation: {
    fullNameRequired: 'Please enter your name.',
    fullNameTooLong: 'Your name is too long (at most {{max}} characters).',
    phoneInvalid: 'Please enter a valid phone number.',
    emailInvalid: 'Please enter a valid email address.',
    passwordRequired: 'Please enter your password.',
    passwordTooShort: 'Your password must be at least {{min}} characters.',
    passwordTooLong: 'Your password is too long (at most {{max}} characters).',
  },
  errors: {
    invalidCredentials: 'Incorrect email or password.',
    emailNotConfirmed: 'Please confirm your email first. Check your inbox for the link.',
    emailTaken: 'An account with this email already exists. Try signing in instead.',
    weakPassword: 'Please choose a stronger password.',
    tooManyRequests: 'Too many attempts. Please wait a moment and try again.',
    network: 'No connection. Check your internet and try again.',
    generic: 'Something went wrong. Please try again.',
  },
  account: {
    greeting: 'Hello, {{name}}',
    roleLabel: 'Account type',
    role: {
      customer: 'Customer',
      store: 'Store',
      rider: 'Rider',
    },
    signOut: 'Sign out',
  },
  profileProblem: {
    title: 'We could not load your account',
    body: 'Check your connection and try again. If this keeps happening, sign out and sign in again.',
  },
};
