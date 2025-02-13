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
    if (!email || typeof email !== "string") {
      throw new Error("Invalid email provided to getClientId.");
    }
  
    try {
      const headers = await getFreshBooksHeaders(); // Use admin account token
  
      const response = await axios.get(
        `https://api.freshbooks.com/accounting/account/${process.env.FRESHBOOKS_ACCOUNT_ID}/users/clients`,
        { headers }
      );
      const clients = response.data.response?.result?.clients || []; // Handle undefined `clients`
  
      // Find client by email
      let client = clients.find(
        (c) =>
          c.email &&
          typeof c.email === "string" &&
          c.email.trim().toLowerCase() === email.trim().toLowerCase()
      );
      
  
      // If not found, create a new client
      if (!client) {
        const clientId = await createClient(email);
        return clientId;
      }
  
      return client.id;
    } catch (error) {
      console.error("Error fetching client ID:", error.response?.data || error.message);
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

//record payment for reservation payment

const recordPayment = async (email, amount) => {
    try {
        if (!email || typeof email !== "string") {
            throw new Error("Invalid email provided to recordPayment.");
        }
        if (!amount || typeof amount !== "number" || amount <= 0) {
            throw new Error("Invalid amount provided to recordPayment.");
        }

        const clientId = await getClientId(email);
        if (!clientId) {
            throw new Error("Client ID is required but missing.");
        }

        const headers = await getFreshBooksHeaders();

        // Fetch the invoice ID
        const invoiceResponse = await axios.get(
            `https://api.freshbooks.com/accounting/account/${process.env.FRESHBOOKS_ACCOUNT_ID}/invoices/invoices?client_id=${clientId}`,
            { headers }
        );

        const invoiceId = invoiceResponse.data.response.result.invoices[0]?.invoiceid;
    
        if (!invoiceId) {
            throw new Error("No invoice found for this client.");
        }

        const paymentData = {
            customerid: clientId,
            amount: {
                amount,
                currency: "USD",
            },
            invoiceid: invoiceId,
            date: new Date().toISOString().split("T")[0],
            payment_date: new Date().toISOString().split("T")[0],
            note: "Payment for Reservation transaction",
        };

   

        const response = await axios.post(
            `https://api.freshbooks.com/accounting/account/${process.env.FRESHBOOKS_ACCOUNT_ID}/payments/payments`,
            { payment: paymentData },
            { headers }
        );

      

        return response.data;
    } catch (error) {
        console.error("Error recording payment:", JSON.stringify(error.response?.data, null, 2));
        throw new Error(error.response?.data?.message || error.message);
    }
};




module.exports = {
    getClientId,
    createClient,
    createInvoice,
    exchangeAuthorizationCodeForToken,
    recordPayment
};



