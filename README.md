# Roomie Match

**RoomieMatch** is a centralized roommate-finder database that connects people looking for housing and roommates in one system.

## Team

- Max Siebengartner
- Zain Rizvi

## Project Overview

RoomieMatch models how a roommate-finder platform stores:

- users
- listings
- preferences
- match activity

The system centralizes all data into one relational database so relationships are clear and easy to query. It supports preference matching, listing management, and user connection logs.

## Installation

1. Download the /MongoDump folder
2. Start MongoDB on a local port
3. Run `mongorestore --uri="mongodb://localhost:<port>/" --db roomie-match /path/to/MongoDump`
4. The 'Users', 'Listings', and 'Messages' collections will be created on your Mongo server

## Project Structure

MongoDump/ - contains the database collections as json binary
Queries/ - contains all queries with titles and descriptions as markdown
Schemas/ - contains document schemas and the corre

# Links
- ## (Video Demo)[https://youtu.be/b99GpZpWbyg]
- ## (ERD & UML)[https://lucid.app/lucidchart/4a6c9e78-f4b4-46f5-9289-72106dd7cd9b/edit?invitationId=inv_93d4c3f4-1932-4f11-a77c-26275a2647cf]
