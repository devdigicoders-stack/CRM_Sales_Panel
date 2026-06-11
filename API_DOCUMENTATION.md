# CRM PANEL - COMPLETE API DOCUMENTATION

## Base URL
```
http://localhost:5000/api
https://api.crm.example.com/api
```

## Authentication
All endpoints require Bearer token in Authorization header:
```
Authorization: Bearer <token>
Content-Type: application/json
```

---

## LEADS ENDPOINTS

### 1. Get All Leads
**Endpoint:** `GET /leads`

**Query Parameters:**
```
- status: string (optional) - Filter by status
- priority: string (optional) - Filter by priority  
- assignedTo: string (optional) - Filter by assigned user ID
- page: number (default: 1) - Pagination page
- limit: number (default: 10) - Items per page
- search: string (optional) - Search by name/phone/email
```

**Request:**
```bash
GET /leads?status=interested&priority=high&page=1&limit=10
Authorization: Bearer token
```

**Success Response (200):**
```json
{
  "status": "success",
  "data": {
    "leads": [
      {
        "_id": "lead_001",
        "name": "John Doe",
        "phone": "9999999999",
        "email": "john@example.com",
        "source": "Website",
        "status": "interested",
        "priority": "high",
        "dealValue": 25000,
        "productDetails": "Fiber Router + CCTV",
        "verificationStatus": "verified",
        "paymentStatus": "pending",
        "deliveryStatus": "pending",
        "installationStatus": "pending",
        "followUpDate": "2024-02-15",
        "tags": ["urgent", "high-value"],
        "remarks": [
          {
            "_id": "remark_001",
            "note": "Customer interested in package",
            "createdAt": "2024-02-10T10:00:00Z",
            "addedBy": { "_id": "user_001", "name": "Agent Name" }
          }
        ],
        "meetings": [
          {
            "_id": "meeting_001",
            "title": "Demo Call",
            "date": "2024-02-12T14:00:00Z",
            "location": "Online",
            "notes": "Product demo scheduled"
          }
        ],
        "assignedTo": {
          "_id": "user_001",
          "name": "Sales Agent",
          "email": "agent@example.com",
          "role": "Sales Executive"
        },
        "integrations": {
          "whatsappLink": "https://wa.me/9999999999"
        },
        "createdAt": "2024-02-01T09:00:00Z",
        "updatedAt": "2024-02-10T15:30:00Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 50,
      "itemsPerPage": 10
    }
  }
}
```

**Error Response (400/401/500):**
```json
{
  "status": "error",
  "message": "Failed to fetch leads",
  "error": "Error details here"
}
```

---

### 2. Get Lead by ID
**Endpoint:** `GET /leads/:id`

**Request:**
```bash
GET /leads/lead_001
Authorization: Bearer token
```

**Success Response (200):**
```json
{
  "status": "success",
  "data": {
    "lead": {
      "_id": "lead_001",
      "name": "John Doe",
      "phone": "9999999999",
      "email": "john@example.com",
      "source": "Website",
      "status": "interested",
      "priority": "high",
      "dealValue": 25000,
      "productDetails": "Fiber Router + CCTV",
      "verificationStatus": "verified",
      "paymentStatus": "pending",
      "deliveryStatus": "pending",
      "installationStatus": "pending",
      "followUpDate": "2024-02-15",
      "accountRemarks": "VIP customer",
      "tags": ["urgent", "high-value"],
      "remarks": [],
      "meetings": [],
      "assignedTo": {},
      "integrations": {},
      "createdAt": "2024-02-01T09:00:00Z",
      "updatedAt": "2024-02-10T15:30:00Z"
    }
  }
}
```

**Error Response (404):**
```json
{
  "status": "error",
  "message": "Lead not found"
}
```

---

### 3. Update Lead
**Endpoint:** `PUT /leads/:id`

**Request Body:**
```json
{
  "status": "interested",
  "priority": "high",
  "productDetails": "Updated details",
  "dealValue": 30000,
  "verificationStatus": "verified",
  "paymentStatus": "completed",
  "deliveryStatus": "pending",
  "installationStatus": "pending",
  "followUpDate": "2024-02-20",
  "tags": ["tag1", "tag2"]
}
```

**Request:**
```bash
PUT /leads/lead_001
Authorization: Bearer token
Content-Type: application/json

{
  "status": "interested",
  "dealValue": 30000
}
```

**Success Response (200):**
```json
{
  "status": "success",
  "message": "Lead updated successfully",
  "data": {
    "lead": { }
  }
}
```

---

### 4. Add Remark
**Endpoint:** `POST /leads/:id/remarks`

**Request Body:**
```json
{
  "note": "Customer confirmed interest in product",
  "followUpDate": "2024-02-20"
}
```

**Request:**
```bash
POST /leads/lead_001/remarks
Authorization: Bearer token
Content-Type: application/json

{
  "note": "Customer confirmed interest",
  "followUpDate": "2024-02-20"
}
```

**Success Response (201):**
```json
{
  "status": "success",
  "message": "Remark added successfully",
  "data": {
    "lead": {
      "_id": "lead_001",
      "remarks": [
        {
          "_id": "remark_002",
          "note": "Customer confirmed interest",
          "createdAt": "2024-02-10T16:00:00Z",
          "addedBy": {
            "_id": "user_001",
            "name": "Sales Agent"
          }
        }
      ]
    }
  }
}
```

**Error Response (400):**
```json
{
  "status": "error",
  "message": "Note cannot be empty"
}
```

---

### 5. Schedule Meeting
**Endpoint:** `POST /leads/:id/meetings`

**Request Body:**
```json
{
  "title": "Product Demo Call",
  "date": "2024-02-15T14:00:00Z",
  "location": "Online",
  "notes": "Demo of fiber router setup"
}
```

**Request:**
```bash
POST /leads/lead_001/meetings
Authorization: Bearer token
Content-Type: application/json

{
  "title": "Product Demo Call",
  "date": "2024-02-15T14:00:00Z",
  "location": "Online",
  "notes": "Demo of setup"
}
```

**Success Response (201):**
```json
{
  "status": "success",
  "message": "Meeting scheduled successfully",
  "data": {
    "meeting": {
      "_id": "meeting_001",
      "leadId": "lead_001",
      "title": "Product Demo Call",
      "date": "2024-02-15T14:00:00Z",
      "location": "Online",
      "notes": "Demo of setup",
      "createdAt": "2024-02-10T16:30:00Z"
    }
  }
}
```

---

### 6. Update Meeting (Optional - for future use)
**Endpoint:** `PUT /leads/:id/meetings/:meetingId`

**Request Body:**
```json
{
  "title": "Updated meeting title",
  "date": "2024-02-16T14:00:00Z",
  "location": "Updated location",
  "notes": "Updated notes"
}
```

---

### 7. Confirm Sale
**Endpoint:** `POST /leads/:id/confirm-sale`

**Request Body:**
```json
{
  "productDetails": "Fiber Router + CCTV Setup",
  "dealValue": 25000,
  "accountRemarks": "VIP customer - priority delivery",
  "transferToAccounts": true
}
```

**Request:**
```bash
POST /leads/lead_001/confirm-sale
Authorization: Bearer token
Content-Type: application/json

{
  "productDetails": "Fiber Router + CCTV",
  "dealValue": 25000,
  "accountRemarks": "VIP customer",
  "transferToAccounts": true
}
```

**Success Response (200):**
```json
{
  "status": "success",
  "message": "Sale confirmed and transferred to Accounts Team",
  "data": {
    "lead": {
      "_id": "lead_001",
      "status": "converted",
      "productDetails": "Fiber Router + CCTV",
      "dealValue": 25000,
      "accountRemarks": "VIP customer",
      "updatedAt": "2024-02-10T17:00:00Z"
    }
  }
}
```

**Error Response (400):**
```json
{
  "status": "error",
  "message": "Product details and deal value are required"
}
```

---

### 8. Update Delivery
**Endpoint:** `PUT /leads/:id/delivery`

**Request Body:**
```json
{
  "deliveryStatus": "in_progress",
  "expectedDelivery": "2024-02-25",
  "deliveryNotes": "Items dispatched from warehouse"
}
```

**Valid Delivery Statuses:**
- `pending` - Not yet sent
- `in_progress` - In transit
- `delivered` - Successfully delivered
- `cancelled` - Order cancelled

**Request:**
```bash
PUT /leads/lead_001/delivery
Authorization: Bearer token
Content-Type: application/json

{
  "deliveryStatus": "in_progress",
  "expectedDelivery": "2024-02-25",
  "deliveryNotes": "On the way"
}
```

**Success Response (200):**
```json
{
  "status": "success",
  "message": "Delivery status updated successfully",
  "data": {
    "lead": {
      "_id": "lead_001",
      "deliveryStatus": "in_progress",
      "expectedDelivery": "2024-02-25",
      "deliveryNotes": "On the way",
      "updatedAt": "2024-02-10T17:30:00Z"
    }
  }
}
```

---

### 9. Upload Sale Documents (Optional)
**Endpoint:** `PUT /leads/:id/sale-documents`

**Request:**
```bash
PUT /leads/lead_001/sale-documents
Authorization: Bearer token
Content-Type: multipart/form-data

[Form Data]
- agreement: <file>
```

---

### 10. Transfer to Accounts (Optional)
**Endpoint:** `PUT /leads/:id/transfer-to-accounts`

**Request:**
```bash
PUT /leads/lead_001/transfer-to-accounts
Authorization: Bearer token
```

**Success Response (200):**
```json
{
  "status": "success",
  "message": "Lead transferred to Accounts Team",
  "data": {
    "lead": {
      "_id": "lead_001",
      "status": "converted",
      "transferredTo": "Accounts Team",
      "transferredAt": "2024-02-10T17:45:00Z"
    }
  }
}
```

---

## STATUS CODES REFERENCE

| Code | Meaning | Example |
|------|---------|---------|
| 200 | OK - Request successful | Lead fetched/updated |
| 201 | Created - Resource created | Meeting scheduled |
| 400 | Bad Request - Invalid input | Missing required field |
| 401 | Unauthorized - No auth token | Token expired |
| 403 | Forbidden - No permission | Can't access other user's data |
| 404 | Not Found - Resource doesn't exist | Lead ID not found |
| 500 | Server Error - Backend issue | Database error |

---

## DATA MODELS

### Lead Model
```javascript
{
  _id: ObjectId,
  name: String (required),
  phone: String (required, unique),
  email: String,
  source: String (enum: ['Website', 'Phone', 'Referral', 'Social Media']),
  status: String (enum: ['new', 'assigned', 'interested', 'in_process', 'converted', 'closed', 'not_interested']),
  priority: String (enum: ['low', 'medium', 'high']),
  dealValue: Number,
  productDetails: String,
  verificationStatus: String,
  paymentStatus: String,
  deliveryStatus: String,
  installationStatus: String,
  followUpDate: Date,
  accountRemarks: String,
  tags: [String],
  remarks: [{
    _id: ObjectId,
    note: String,
    createdAt: Date,
    addedBy: { _id, name, email }
  }],
  meetings: [{
    _id: ObjectId,
    title: String,
    date: Date,
    location: String,
    notes: String,
    createdAt: Date
  }],
  assignedTo: {
    _id: ObjectId,
    name: String,
    email: String,
    role: String
  },
  integrations: {
    whatsappLink: String
  },
  createdAt: Date,
  updatedAt: Date
}
```

---

## ERROR HANDLING

### Common Error Responses

**Validation Error (400):**
```json
{
  "status": "error",
  "message": "Validation failed",
  "errors": [
    {
      "field": "dealValue",
      "message": "Deal value must be a positive number"
    }
  ]
}
```

**Authentication Error (401):**
```json
{
  "status": "error",
  "message": "Unauthorized",
  "code": "AUTH_001"
}
```

**Server Error (500):**
```json
{
  "status": "error",
  "message": "Internal server error",
  "code": "ERR_500",
  "requestId": "req_12345"
}
```

---

## RATE LIMITING

```
- 100 requests per minute per user
- 1000 requests per hour per user
- Headers returned:
  X-RateLimit-Limit: 100
  X-RateLimit-Remaining: 99
  X-RateLimit-Reset: 1708057200
```

---

## PAGINATION

All list endpoints support pagination:

**Query Parameters:**
```
?page=1&limit=10
?page=2&limit=20
```

**Response Includes:**
```json
{
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 50,
    "itemsPerPage": 10,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

---

## FILTERING & SEARCH

**By Status:**
```
GET /leads?status=interested
```

**By Priority:**
```
GET /leads?priority=high
```

**By Date Range:**
```
GET /leads?startDate=2024-02-01&endDate=2024-02-28
```

**Search:**
```
GET /leads?search=john doe
```

**Combined:**
```
GET /leads?status=interested&priority=high&search=john&page=1&limit=10
```

---

## TESTING THE APIS

### Using cURL

```bash
# Get all leads
curl -X GET "http://localhost:5000/api/leads" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get specific lead
curl -X GET "http://localhost:5000/api/leads/lead_001" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Add remark
curl -X POST "http://localhost:5000/api/leads/lead_001/remarks" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "note": "Customer interested",
    "followUpDate": "2024-02-20"
  }'

# Schedule meeting
curl -X POST "http://localhost:5000/api/leads/lead_001/meetings" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Demo Call",
    "date": "2024-02-15T14:00:00Z",
    "location": "Online"
  }'

# Confirm sale
curl -X POST "http://localhost:5000/api/leads/lead_001/confirm-sale" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "productDetails": "Fiber Router",
    "dealValue": 25000,
    "transferToAccounts": true
  }'

# Update delivery
curl -X PUT "http://localhost:5000/api/leads/lead_001/delivery" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "deliveryStatus": "in_progress",
    "expectedDelivery": "2024-02-25"
  }'
```

### Using Postman

1. Create new request
2. Set method (GET/POST/PUT)
3. Enter URL: `http://localhost:5000/api/leads`
4. Go to Headers tab
5. Add: `Authorization: Bearer YOUR_TOKEN`
6. For POST/PUT requests, go to Body tab
7. Select "raw" and "JSON"
8. Paste JSON data
9. Click Send

---

## WEBHOOK EVENTS (Future Enhancement)

```
- lead.created
- lead.updated
- lead.status_changed
- remark.added
- meeting.scheduled
- sale.confirmed
- delivery.updated
```

---

## VERSION INFO

- API Version: v1
- Last Updated: 2024-02-10
- Status: Production Ready
