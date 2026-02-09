# API Routes Documentation

## 1. Users API

### Endpoint: `/api/users`

#### GET
- Requires header
- Example: `name: Test Child`

#### POST
- Requires JSON body
- Example:
```
{
"name": "Test Child",
"age": 8,
"diagnosis": "ASD",
"preferred_words": ["cat", "dog", "ball"],
"past_interactions": [
{
"sentence": ["I", "want", "play"]
}
]
}
```

## 2. Cards API

### Endpoint: `/api/cards`

#### GET
- Get all cards: `GET http://localhost:3000/api/cards`
- Get card by ID: `GET http://localhost:3000/api/cards?id=65abcdef1234567890`
- Get card by word: `GET http://localhost:3000/api/cards?word=apple`

#### POST
- Endpoint: `http://localhost:3000/api/cards`
- Header: `Content-Type: application/json`
- Example body:
```
{
"word": "apple",
"image": "apple.jpg",
"category": "places", 
"follow_up_words": ["eat", "red"] // Optional
}
```


## 3. Categories API

### Endpoint: `/api/categories`

#### GET
- Get all categories: `GET http://localhost:3000/api/categories`
- Get category by name: `GET http://localhost:3000/api/cards?name=places`


## 4. Recommendations API

### Endpoint: `/api/recommendations`

#### POST

- Header - Content-Type: application/json
- Body:
```
{
  "selectedWords": ["I", "want"]
}
```

- Response format:
```
{
    "suggestions": [
        "Scarf",
        "Cat",
        "Cookies",
        "Make",
        "Open",
        "Clothes"
    ]
}

```