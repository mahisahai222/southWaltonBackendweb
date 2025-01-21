const axios = require('axios');


const getFreshBooksHeaders = async () => {
    const { ensureFreshBooksToken } = require('../controllers/authController');
    const accessToken = await ensureFreshBooksToken();
    return {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    };
  };
  

const createInvoice = async (email, amount) => {
    try {
        const clientId = await getClientId(email);

        if (!clientId) {
            throw new Error('Client ID is required but missing.');
        }

        const headers = await getFreshBooksHeaders();

        const invoiceData = {
            customerid: clientId,
            create_date: new Date().toISOString().split('T')[0], // Current date in YYYY-MM-DD
            lines: [
                {
                    name: 'SWE',
                    qty: 1,
                    unit_cost: { amount, currency: 'USD' },
                },
            ],
        };

        const response = await axios.post(
            `https://api.freshbooks.com/accounting/account/${process.env.FRESHBOOKS_ACCOUNT_ID}/invoices/invoices`,
            { invoice: invoiceData },
            { headers }
        );

        return response.data;
    } catch (error) {
        console.error('Error creating invoice:', error.response?.data || error.message);
        throw new Error(error.response?.data?.message || error.message);
    }
};



const createClient = async (email) => {
    try {
        const headers = await getFreshBooksHeaders();

        const clientData = { email };
        const response = await axios.post(
            `https://api.freshbooks.com/accounting/account/${process.env.FRESHBOOKS_ACCOUNT_ID}/users/clients`,
            { client: clientData },
            { headers }
        );

        return response.data.response.result.client.id;
    } catch (error) {
        console.error('Error creating client:', JSON.stringify(error.response?.data || error.message, null, 2));
        throw new Error(error.response?.data?.response?.errors[0]?.message || error.message);
    }
};



const getClientId = async (email) => {
    try {
      const headers = await getFreshBooksHeaders(); // Use admin account token
  
      const response = await axios.get(
        `https://api.freshbooks.com/accounting/account/${process.env.FRESHBOOKS_ACCOUNT_ID}/users/clients`,
        { headers }
      );
      const clients = response.data.response?.result?.clients || []; // Handle undefined `clients`
  

      // Find client by email
      let client = clients.find((c) => c.email.trim().toLowerCase() === email.trim().toLowerCase());
  
      // If not found, create a new client
      if (!client) {
        const clientId = await createClient(email);
        return clientId;
      }
  
      return client.id;
    } catch (error) {
      console.error('Error fetching client ID:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || error.message);
    }
  };
  
  

//for token/referesh/access


const exchangeAuthorizationCodeForToken = async (code) => {
    const response = await axios.post('https://auth.freshbooks.com/oauth/token', {
        grant_type: 'authorization_code',
        client_id: process.env.FRESHBOOKS_CLIENT_ID,
        client_secret: process.env.FRESHBOOKS_CLIENT_SECRET,
        redirect_uri: process.env.FRESHBOOKS_REDIRECT_URI,
        code,
    });
    return response.data;
};

module.exports = {
    getClientId,
    createClient,
    createInvoice,
    exchangeAuthorizationCodeForToken
};



