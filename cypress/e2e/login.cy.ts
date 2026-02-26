describe('Login Page (E2E)', () => {
  const emailInput = '#form-login-email';
  const passwordInput = '#form-login-password';
  const loginButton = 'button[type="submit"]';
  const togglePasswordButton = 'button[aria-label="toggle-password"]';

  const loginApiUrl = 'https://forum-api.dicoding.dev/v1/login';

  beforeEach(() => {
    cy.visit('/login');
  });

  it('should render login page correctly', () => {
    cy.contains('Login to Continue').should('be.visible');
    cy.contains('Enter your email below to login to your account').should('be.visible');

    cy.get(emailInput).should('be.visible');
    cy.get(passwordInput).should('be.visible');

    cy.contains('button', 'Login').should('be.visible').and('not.be.disabled');

    cy.contains('Register').should('have.attr', 'href').and('include', '/register');
  });

  it('should show validation errors when submitting empty form', () => {
    cy.get(loginButton).click();

    cy.get(emailInput).should('have.attr', 'aria-invalid', 'true');
    cy.get(passwordInput).should('have.attr', 'aria-invalid', 'true');
  });

  it('should toggle password visibility when clicking toggle button', () => {
    cy.get(passwordInput).should('have.attr', 'type', 'password');

    cy.get(togglePasswordButton).click();
    cy.get(passwordInput).should('have.attr', 'type', 'text');

    cy.get(togglePasswordButton).click();
    cy.get(passwordInput).should('have.attr', 'type', 'password');
  });

  it('should successfully login and redirect to home page', () => {
    cy.intercept('POST', loginApiUrl, {
      statusCode: 200,
      body: {
        status: 'success',
        message: 'Login success',
        data: { token: 'fake-jwt-token' },
      },
    }).as('loginRequest');

    cy.get(emailInput).type('example@dicoding.com');
    cy.get(passwordInput).type('password123');
    cy.contains('button', 'Login').click();

    cy.wait('@loginRequest').its('request.body').should('deep.include', {
      email: 'example@dicoding.com',
      password: 'password123',
    });

    cy.location('pathname').should('eq', '/');
  });

  it('should show error message when login fails', () => {
    cy.intercept('POST', loginApiUrl, {
      statusCode: 401,
      body: {
        status: 'fail',
        message: 'Invalid credentials',
      },
    }).as('loginFailRequest');

    cy.get(emailInput).type('wrong@example.com');
    cy.get(passwordInput).type('wrongpassword');
    cy.contains('button', 'Login').click();

    cy.wait('@loginFailRequest');

    cy.contains(/invalid|unauthorized|credentials/i).should('be.visible');

    cy.get(emailInput).should('have.attr', 'aria-invalid', 'true');
    cy.get(passwordInput).should('have.attr', 'aria-invalid', 'true');
  });

  it('should disable login button while request is in progress', () => {
    cy.intercept('POST', loginApiUrl, (req) => {
      req.reply((res) => {
        res.setDelay(800);
        res.send({
          statusCode: 200,
          body: {
            status: 'success',
            message: 'Login success',
            data: { token: 'fake-jwt-token' },
          },
        });
      });
    }).as('slowLoginRequest');

    cy.get(emailInput).type('example@dicoding.com');
    cy.get(passwordInput).type('password123');
    cy.contains('button', 'Login').click();

    cy.contains('button', 'Login').should('be.disabled');

    cy.wait('@slowLoginRequest');
  });
});
