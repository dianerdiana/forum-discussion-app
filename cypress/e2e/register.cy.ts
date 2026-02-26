describe('Register Page (E2E)', () => {
  const nameInput = '#form-register-name';
  const emailInput = '#form-register-email';
  const passwordInput = '#form-register-password';
  const togglePasswordButton = 'button[aria-label="toggle-password"]';

  const registerButton = 'button[type="submit"]';

  // Match pattern used in login.cy.ts
  const registerApiUrl = '**/v1/register';

  beforeEach(() => {
    cy.visit('/register');
  });

  it('should render register page correctly', () => {
    cy.contains('Create an Account').should('be.visible');
    cy.contains('Enter your information below to create your account').should('be.visible');

    cy.get(nameInput).should('be.visible');
    cy.get(emailInput).should('be.visible');
    cy.get(passwordInput).should('be.visible');

    cy.contains('button', 'Register').should('be.visible').and('not.be.disabled');

    cy.contains('Login').should('have.attr', 'href').and('include', '/login');
  });

  it('should show validation errors when submitting empty form', () => {
    cy.get(registerButton).click();

    cy.get(nameInput).should('have.attr', 'aria-invalid', 'true');
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

  it('should successfully register and redirect to login page', () => {
    cy.intercept('POST', registerApiUrl, {
      statusCode: 200,
      body: {
        status: 'success',
        message: 'User registered',
        data: {
          user: {
            id: 'user-1',
            name: 'John Doe',
            email: 'john.doe@dicoding.com',
          },
        },
      },
    }).as('registerRequest');

    cy.get(nameInput).type('John Doe');
    cy.get(emailInput).type('john.doe@dicoding.com');
    cy.get(passwordInput).type('123456');
    cy.contains('button', 'Register').click();

    cy.wait('@registerRequest').its('request.body').should('deep.include', {
      name: 'John Doe',
      email: 'john.doe@dicoding.com',
      password: '123456',
    });

    cy.location('pathname').should('eq', '/login');
  });

  it('should show error message when register fails', () => {
    cy.intercept('POST', registerApiUrl, {
      statusCode: 400,
      body: {
        status: 'fail',
        message: 'Email already used',
      },
    }).as('registerFailRequest');

    cy.get(nameInput).type('John Doe');
    cy.get(emailInput).type('john.doe@dicoding.com');
    cy.get(passwordInput).type('123456');
    cy.contains('button', 'Register').click();

    cy.wait('@registerFailRequest');

    // Toast message should appear (sonner)
    cy.contains(/email already used|fail|error/i).should('be.visible');

    // Should remain on register page
    cy.location('pathname').should('eq', '/register');
  });

  it('should disable register button while request is in progress', () => {
    cy.intercept('POST', registerApiUrl, (req) => {
      req.reply((res) => {
        res.setDelay(800);
        res.send({
          statusCode: 200,
          body: {
            status: 'success',
            message: 'User registered',
            data: {
              user: {
                id: 'user-1',
                name: 'John Doe',
                email: 'john.doe@dicoding.com',
              },
            },
          },
        });
      });
    }).as('slowRegisterRequest');

    cy.get(nameInput).type('John Doe');
    cy.get(emailInput).type('john.doe@dicoding.com');
    cy.get(passwordInput).type('123456');
    cy.contains('button', 'Register').click();

    cy.contains('button', 'Register').should('be.disabled');

    cy.wait('@slowRegisterRequest');
  });
});
