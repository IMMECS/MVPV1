# Document Validator for Swedish Company Law (ABL)

A modular full-stack application that analyzes documents (.docx or .pdf) for compliance with Swedish Company Law (ABL) requirements and generates structured reports.

## Features

- **Document Upload**: Securely upload .docx and .pdf files (max 10MB)
- **Automated Analysis**: Rule-based validation against Swedish Company Law requirements
- **Compliance Reports**: Visual presentation of compliance status and detailed rule results
- **Security**: AES-256 encryption for stored documents and data
- **User Authentication**: JWT-based authentication and authorization

## Architecture

The application consists of two main components:

### Backend (NestJS)

- REST API with versioned endpoints (`/api/v1/`)
- Document extraction using format-specific extractors (Mammoth for .docx, pdf-parse for .pdf)
- Modular rule engine with pluggable validators
- MongoDB document storage with automatic expiration (24 hours)
- Encrypted document storage and processing

### Frontend (Next.js)

- Modern React components with TypeScript
- Responsive UI using Tailwind CSS
- Real-time validation status updates
- Secure file uploads with client-side validation
- Authentication and user management

## Installation

### Prerequisites

- Node.js 16+ and npm
- MongoDB instance
- (Optional) Docker and Docker Compose

### Backend Setup

1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file based on `.env.example`:
   ```
   cp .env.example .env
   ```

4. Update the environment variables in `.env`:
   ```
   # Database
   MONGODB_URI=mongodb://localhost:27017/document-validator
   
   # Security
   JWT_SECRET=your_jwt_secret_key
   ENCRYPTION_KEY=your_aes_encryption_key
   
   # File Storage
   UPLOAD_DIR=./uploads
   ```

5. Start the development server:
   ```
   npm run start:dev
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```
   cd frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env.local` file based on `.env.local.example`:
   ```
   cp .env.local.example .env.local
   ```

4. Update the environment variables in `.env.local`:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
   NEXT_PUBLIC_ENCRYPTION_KEY=your_encryption_key_min_32_chars_long
   ```

5. Start the development server:
   ```
   npm run dev
   ```

## Usage

1. Navigate to `http://localhost:3000` in your browser
2. Register an account or login
3. Upload a document (.docx or .pdf) from the dashboard
4. Wait for analysis to complete
5. View detailed compliance report with rule-by-rule results

## Project Structure

```
├── backend/                  # NestJS backend
│   ├── src/
│   │   ├── api/              # API controllers and services
│   │   ├── auth/             # Authentication module
│   │   ├── extractors/       # Document extraction logic
│   │   ├── validators/       # Validation rules
│   │   └── error/            # Error handling
├── frontend/                 # Next.js frontend
│   ├── app/                  # Next.js app directory
│   │   ├── api/              # API client services
│   │   ├── auth/             # Authentication pages
│   │   ├── components/       # Reusable components
│   │   ├── dashboard/        # Dashboard pages
│   │   └── utils/            # Utility functions
```

## Development

### Adding New Validators

1. Create a new validator file in `backend/src/validators/`
2. Implement the `IValidator` interface
3. Register the validator in the `ValidatorRegistry` service

Example validator:
```typescript
@Injectable()
export class MyCustomValidator implements IValidator {
  id = 'ABL-X-Y';
  description = 'Custom rule description';
  
  validate(document: ParsedDocument): RuleResult {
    // Implement validation logic
    return {
      ruleId: this.id,
      description: this.description,
      passed: true,
      details: ['Details about the validation']
    };
  }
}
```

### Adding New Document Types

1. Create a new extractor in `backend/src/extractors/`
2. Implement the `IDocumentExtractor` interface
3. Register the extractor in the `ExtractorService`

## Testing

### Backend

```
cd backend
npm run test        # Run unit tests
npm run test:e2e    # Run end-to-end tests
npm run test:cov    # Generate test coverage
```

### Frontend

```
cd frontend
npm run test        # Run Jest tests
npm run test:e2e    # Run Cypress end-to-end tests
```

## Security Considerations

- All uploaded documents are encrypted using AES-256
- Documents are stored securely and deleted after 24 hours
- JWT tokens are used for authentication with short expiration times
- API endpoints are protected with appropriate authorization
- Input sanitization is enforced throughout the application

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [NestJS](https://nestjs.com/) - Backend framework
- [Next.js](https://nextjs.org/) - Frontend framework
- [Mammoth](https://github.com/mwilliamson/mammoth.js) - DOCX parsing
- [pdf-parse](https://github.com/mozilla/pdf.js-extract) - PDF parsing
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework 