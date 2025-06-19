export const API_CONFIG = {
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000',
    endpoints: {
        auth: {
            login: '/api/v1/auth/login',
            me: '/api/v1/auth/me',
            permissions: '/api/v1/auth/me/permissions',
            valetLogin: '/api/v1/valet-auth/login',
            valetProfile: '/api/v1/valet-auth/profile'
        },
        employees: '/api/v1/employees/',
        subscriptions: '/api/v1/subscriptions/',
        transactions: '/api/v1/transactions/',
        roles: '/api/v1/roles/',
        locations: '/api/v1/locations/',
        parkings: '/api/v1/parkings/',
        valetSessions: '/api/v1/valet-sessions/',
        subscription_templates: '/api/v1/subscription-templates/'
    }
}; 