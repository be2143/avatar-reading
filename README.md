# Voxy - Social Story Teller

This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://www.google.com/search?q=%5Bhttps://github.com/vercel/next.js/tree/canary/packages/create-next-app%5D\(https://github.com/vercel/next.js/tree/canary/packages/create-next-app\)).

-----

## Getting Started

To get this project up and running on your local machine, follow these steps:

### 1\. Install Node.js and npm

If you don't have **Node.js** (which includes **npm**) installed, you'll need to get it first. You can download the recommended version from the official Node.js website:

  * **Download Node.js:** [https://nodejs.org/en/download/](https://nodejs.org/en/download/)

Alternatively, you can use a Node.js version manager like `nvm` (Node Version Manager) for more flexibility.

To verify your installation, open your terminal or command prompt and run:

```bash
node -v
npm -v
```

This should display the installed versions of Node.js and npm.

### 2\. Install Project Dependencies

Navigate to the root directory of your project in your terminal and install all necessary dependencies using npm:

```bash
npm install
```

This command reads the `package.json` file and installs all the listed dependencies required for the project to run.

### 3\. Configure Environment Variables

Create a file named **`.env`** in the root of your project and add the following environment variables. **Remember to replace these placeholder values with your actual API keys and secrets.**

```bash

```
Generate NEXTAUTH_SECRET:

For the NEXTAUTH_SECRET, it is crucial to use a strong, randomly generated string. You can generate one directly in your terminal using Node.js:

```bash

node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output from this command and paste it as the value for NEXTAUTH_SECRET in your .env file.


### 4\. Run the Development Server

Once the dependencies are installed and your environment variables are set, you can start the development server from the app directory:
```bash
cp app
npm run dev
```

Open [http://localhost:3000](https://www.google.com/search?q=http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

-----

## Deploy on Vercel

We will deploy our Next.js app using the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.
