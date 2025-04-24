# **Voxy** 

**Voxy** is an AI-enhanced communication therapy system for speech-impaired autistic children.  
The system integrates ABA therapy, enabling caregivers to practice at home and support their children's communication skills.

---

## **Tech Stack**  

- **Front-end**: Next.js  
- **Back-end**: OpenAI API, Mongoose  
- **Database**: MongoDB - Custom Dataset for AAC  

---

## **Setup Instructions**

### 1. Clone the repository

```bash
git clone https://github.com/SMART-Lab-NYU/Voxy-Buka
cd voxy
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create a .env file and copy/paste the following credentials:

```bash
MONGODB_URI=mongodb+srv://buka:B89941359@cluster0.e4qh0.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
GROQ_CLOUD_API_KEY=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
GROQ_API_KEY=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
```

### 4. Run the development server

```env
npm run dev
```

Then open http://localhost:3000 in your browser to view the app.