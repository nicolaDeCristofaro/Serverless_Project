| Building Access Management | Nicola De Cristofaro|
| --- | --- |

# Serverless Computing Project: Hotel Service Management
The basic problem that this project aims to solve is the management of all kind of accesses in a building; It can be initially applied to a hotel building scenario, but it can be potentially extended to all buildings that need access management.

This goal is reached in a Serverless way: Serverless Computing is a cloud computing model in which code is run as a service without the need for the user to maintain or create the underlying infrastructure.This doesn’t mean that serverless architecture doesn’t require servers, but instead that a third party is managing these servers instead of the developers.

## Project Requisites (Details and requisites of the project)

In a hotel scenario, in most cases, there are many services available to guests such as spa, games room, gym, and so on. However each guest cannot access each service for free, but each service has its cost. To manage the access to these services some roles are assigned to the guests. When a guest pays for the services he wants, a bracelet is issued to the guest. The bracelet will represent the access pass to the services purchased by the guest.

- Bronze: the access is allowed only in the games room
- Silver: the access is allowed for every service, but for a limited number of times
- Gold: the access is allowed for every service unlimited

## Use Case

1. A guest wants to access the games room, so he puts his bracelet on the reader sensor near the games room door;
2. A function checks the role of the guest who made the access request and store the request on database.
3. If that role is allowed to access that particular service, then a message is showed on the screen near the service door: "access allowed" or "access not allowed"

...continue on presentation docs.
