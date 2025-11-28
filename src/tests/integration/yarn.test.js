import request from "supertest";
import mongoose from "mongoose";
import app from "../../app.js";
import Yarn from "../../models/yarn.js";

describe("Yarn Routes - Integration Tests", () => {
    describe("Success Cases", () => {
        describe("POST cases", () => {
            it("should create a yarn with minimal required fields", async () => {
                const yarnData = {
                    name: "Malabrigo Rios",
                };

                const response = await request(app).post("/api/yarns").send(yarnData).expect(201);

                expect(response.body.success).toBe(true);
                expect(response.body.message).toBe("Yarn created successfully");
                expect(response.body.data).toHaveProperty("_id");
                expect(response.body.data.name).toBe("Malabrigo Rios");
                expect(response.body.data.quantityInStash).toBe(1);
                expect(response.body.data.currency).toBe("EUR");

                const yarnInDb = await Yarn.findById(response.body.data._id);
                expect(yarnInDb).not.toBeNull();
                expect(yarnInDb.name).toBe("Malabrigo Rios");
            });

            it("should create a yarn with all optional fields", async () => {
                const yarnData = {
                    name: "Cascade 220",
                    brand: "Cascade Yarns",
                    yarnType: "Worsted",
                    fiberContent: "100% Peruvian Highland Wool",
                    color: "Navy Blue",
                    lotNumber: "LOT-2024-001",
                    length: 200,
                    lengthUnit: "meters",
                    weight: 100,
                    weightUnit: "grams",
                    pricePerUnit: 12.99,
                    currency: "USD",
                    purchaseDate: "2024-01-15T00:00:00.000Z",
                    purchaseLocation: "Local Yarn Shop",
                    quantityInStash: 5,
                    notes: "Perfect for winter projects",
                };

                const response = await request(app).post("/api/yarns").send(yarnData).expect(201);

                expect(response.body.success).toBe(true);
                expect(response.body.data.name).toBe("Cascade 220");
                expect(response.body.data.brand).toBe("Cascade Yarns");
                expect(response.body.data.yarnType).toBe("Worsted");
                expect(response.body.data.fiberContent).toBe("100% Peruvian Highland Wool");
                expect(response.body.data.color).toBe("Navy Blue");
                expect(response.body.data.lotNumber).toBe("LOT-2024-001");
                expect(response.body.data.length).toBe(200);
                expect(response.body.data.lengthUnit).toBe("meters");
                expect(response.body.data.weight).toBe(100);
                expect(response.body.data.weightUnit).toBe("grams");
                expect(response.body.data.pricePerUnit).toBe(12.99);
                expect(response.body.data.currency).toBe("USD");
                expect(response.body.data.purchaseDate).toBe("2024-01-15T00:00:00.000Z");
                expect(response.body.data.purchaseLocation).toBe("Local Yarn Shop");
                expect(response.body.data.quantityInStash).toBe(5);
                expect(response.body.data.notes).toBe("Perfect for winter projects");
            });

            it("should trim whitespace from yarn name", async () => {
                const yarnData = {
                    name: "  Brooklyn Tweed Shelter  ",
                };

                const response = await request(app).post("/api/yarns").send(yarnData).expect(201);

                expect(response.body.data.name).toBe("Brooklyn Tweed Shelter");
            });

            it("should create yarn with numeric fields", async () => {
                const yarnData = {
                    name: "Fingering Weight Yarn",
                    length: 400.5,
                    lengthUnit: "meters",
                    weight: 100.25,
                    weightUnit: "grams",
                    pricePerUnit: 15.99,
                    quantityInStash: 10,
                };

                const response = await request(app).post("/api/yarns").send(yarnData).expect(201);

                expect(response.body.data.length).toBe(400.5);
                expect(response.body.data.lengthUnit).toBe("meters");
                expect(response.body.data.weight).toBe(100.25);
                expect(response.body.data.weightUnit).toBe("grams");
                expect(response.body.data.pricePerUnit).toBe(15.99);
                expect(response.body.data.quantityInStash).toBe(10);
            });

            it("should create yarn with different yarnType categories", async () => {
                const yarnTypes = ["Lace", "Fingering", "Sport", "DK", "Worsted", "Bulky", "Super Bulky"];

                for (const yarnType of yarnTypes) {
                    const yarnData = {
                        name: `Yarn ${yarnType}`,
                        yarnType: yarnType,
                    };

                    const response = await request(app).post("/api/yarns").send(yarnData).expect(201);

                    expect(response.body.data.yarnType).toBe(yarnType);
                }
            });
        });

        describe("GET cases", () => {
            it("should return an empty array when no yarns exist", async () => {
                const response = await request(app).get("/api/yarns");

                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
                expect(response.body.data).toEqual([]);
                expect(response.body.pagination).toBeDefined();
                expect(response.body.pagination.total).toBe(0);
            });

            it("should return all yarns with default pagination", async () => {
                await Yarn.create([
                    { name: "Yarn 1", brand: "Brand A" },
                    { name: "Yarn 2", brand: "Brand B" },
                ]);

                const response = await request(app).get("/api/yarns");

                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
                expect(response.body.data).toHaveLength(2);
                expect(response.body.pagination).toBeDefined();
                expect(response.body.pagination.total).toBe(2);
                expect(response.body.pagination.page).toBe(1);
                expect(response.body.pagination.limit).toBe(20);
                expect(response.body.data.map((y) => y.name)).toContain("Yarn 1");
                expect(response.body.data.map((y) => y.name)).toContain("Yarn 2");
            });

            it("should filter yarns by brand", async () => {
                await Yarn.create([
                    { name: "Malabrigo Rios", brand: "Malabrigo" },
                    { name: "Cascade 220", brand: "Cascade Yarns" },
                ]);

                const response = await request(app).get("/api/yarns?brand=Malabrigo");

                expect(response.status).toBe(200);
                expect(response.body.data).toHaveLength(1);
                expect(response.body.pagination.total).toBe(1);
                expect(response.body.data[0].name).toBe("Malabrigo Rios");
            });

            it("should filter yarns by yarnType", async () => {
                await Yarn.create([
                    { name: "Worsted Yarn", yarnType: "Worsted" },
                    { name: "Fingering Yarn", yarnType: "Fingering" },
                ]);

                const response = await request(app).get("/api/yarns?yarnType=Fingering");

                expect(response.status).toBe(200);
                expect(response.body.data).toHaveLength(1);
                expect(response.body.pagination.total).toBe(1);
                expect(response.body.data[0].name).toBe("Fingering Yarn");
            });

            it("should filter yarns by color", async () => {
                await Yarn.create([
                    { name: "Red Yarn", color: "Red" },
                    { name: "Blue Yarn", color: "Blue" },
                ]);

                const response = await request(app).get("/api/yarns?color=Blue");

                expect(response.status).toBe(200);
                expect(response.body.data).toHaveLength(1);
                expect(response.body.pagination.total).toBe(1);
                expect(response.body.data[0].name).toBe("Blue Yarn");
            });

            it("should return a single yarn by its ID", async () => {
                const yarn = await Yarn.create({ name: "Single Yarn", brand: "Test Brand" });

                const response = await request(app).get(`/api/yarns/${yarn._id}`);

                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
                expect(response.body.data._id).toBe(yarn._id.toString());
                expect(response.body.data.name).toBe("Single Yarn");
            });

            it("should return yarns sorted by updatedAt in descending order", async () => {
                const yarn1 = await Yarn.create({ name: "Yarn 1" });
                await new Promise((resolve) => setTimeout(resolve, 10));
                const yarn2 = await Yarn.create({ name: "Yarn 2" });

                const response = await request(app).get("/api/yarns");

                expect(response.status).toBe(200);
                expect(response.body.data[0].name).toBe("Yarn 2");
                expect(response.body.data[1].name).toBe("Yarn 1");
            });

            describe("Pagination", () => {
                beforeEach(async () => {
                    // Create 30 yarns for pagination testing
                    const yarns = [];
                    for (let i = 1; i <= 30; i++) {
                        yarns.push({
                            name: `Yarn ${i}`,
                            brand: i % 3 === 0 ? "Brand A" : i % 3 === 1 ? "Brand B" : "Brand C",
                            yarnType: i % 2 === 0 ? "Worsted" : "Fingering",
                        });
                    }
                    await Yarn.create(yarns);
                });

                it("should paginate yarns with default limit (20)", async () => {
                    const response = await request(app).get("/api/yarns?page=1");

                    expect(response.status).toBe(200);
                    expect(response.body.success).toBe(true);
                    expect(response.body.data).toHaveLength(20);
                    expect(response.body.pagination).toEqual({
                        page: 1,
                        limit: 20,
                        total: 30,
                        totalPages: 2,
                        hasNext: true,
                        hasPrev: false,
                    });
                });

                it("should return second page of yarns", async () => {
                    const response = await request(app).get("/api/yarns?page=2&limit=20");

                    expect(response.status).toBe(200);
                    expect(response.body.data).toHaveLength(10);
                    expect(response.body.pagination).toEqual({
                        page: 2,
                        limit: 20,
                        total: 30,
                        totalPages: 2,
                        hasNext: false,
                        hasPrev: true,
                    });
                });

                it("should paginate with custom limit", async () => {
                    const response = await request(app).get("/api/yarns?page=1&limit=15");

                    expect(response.status).toBe(200);
                    expect(response.body.data).toHaveLength(15);
                    expect(response.body.pagination).toEqual({
                        page: 1,
                        limit: 15,
                        total: 30,
                        totalPages: 2,
                        hasNext: true,
                        hasPrev: false,
                    });
                });

                it("should return second page with custom limit", async () => {
                    const response = await request(app).get("/api/yarns?page=2&limit=15");

                    expect(response.status).toBe(200);
                    expect(response.body.data).toHaveLength(15);
                    expect(response.body.pagination).toEqual({
                        page: 2,
                        limit: 15,
                        total: 30,
                        totalPages: 2,
                        hasNext: false,
                        hasPrev: true,
                    });
                });

                it("should handle page beyond available data", async () => {
                    const response = await request(app).get("/api/yarns?page=10&limit=20");

                    expect(response.status).toBe(200);
                    expect(response.body.data).toHaveLength(0);
                    expect(response.body.pagination.page).toBe(10);
                    expect(response.body.pagination.total).toBe(30);
                });

                it("should combine pagination with filters (brand)", async () => {
                    const response = await request(app).get("/api/yarns?brand=Brand A&page=1&limit=5");

                    expect(response.status).toBe(200);
                    expect(response.body.data).toHaveLength(5);
                    expect(response.body.pagination.total).toBe(10); // 10 Brand A yarns out of 30
                    expect(response.body.pagination.totalPages).toBe(2);
                    expect(response.body.data.every((y) => y.brand === "Brand A")).toBe(true);
                });

                it("should combine pagination with filters (yarnType)", async () => {
                    const response = await request(app).get("/api/yarns?yarnType=Worsted&page=1&limit=10");

                    expect(response.status).toBe(200);
                    expect(response.body.data).toHaveLength(10);
                    expect(response.body.pagination.total).toBe(15); // 15 Worsted yarns out of 30
                    expect(response.body.pagination.totalPages).toBe(2);
                    expect(response.body.data.every((y) => y.yarnType === "Worsted")).toBe(true);
                });

                it("should combine pagination with multiple filters", async () => {
                    const response = await request(app).get("/api/yarns?brand=Brand B&yarnType=Fingering&page=1&limit=5");

                    expect(response.status).toBe(200);
                    // Brand B (i % 3 === 1) and Fingering (i % 2 === 1) = items 1, 7, 13, 19, 25
                    expect(response.body.pagination.total).toBe(5);
                    expect(response.body.data.every((y) => y.brand === "Brand B" && y.yarnType === "Fingering")).toBe(true);
                });

                it("should handle invalid page number (negative)", async () => {
                    const response = await request(app).get("/api/yarns?page=-1");

                    expect(response.status).toBe(200);
                    expect(response.body.pagination.page).toBe(1); // Should default to page 1
                });

                it("should handle invalid page number (zero)", async () => {
                    const response = await request(app).get("/api/yarns?page=0");

                    expect(response.status).toBe(200);
                    expect(response.body.pagination.page).toBe(1); // Should default to page 1
                });

                it("should cap limit at maximum (100)", async () => {
                    const response = await request(app).get("/api/yarns?limit=500");

                    expect(response.status).toBe(200);
                    expect(response.body.pagination.limit).toBe(100); // Should cap at 100
                });

                it("should handle non-numeric page parameter", async () => {
                    const response = await request(app).get("/api/yarns?page=abc");

                    expect(response.status).toBe(200);
                    expect(response.body.pagination.page).toBe(1); // Should default to page 1
                });

                it("should handle non-numeric limit parameter", async () => {
                    const response = await request(app).get("/api/yarns?limit=xyz");

                    expect(response.status).toBe(200);
                    expect(response.body.pagination.limit).toBe(20); // Should default to 20
                });

                it("should not interfere with yarn filters (page and limit should be excluded from query)", async () => {
                    const response = await request(app).get("/api/yarns?page=1&limit=10&brand=Brand A");

                    expect(response.status).toBe(200);
                    // Should filter by brand, not treat page/limit as filter fields
                    expect(response.body.data.every((y) => y.brand === "Brand A")).toBe(true);
                });

                it("should handle pagination with very small limit", async () => {
                    const response = await request(app).get("/api/yarns?page=5&limit=3");

                    expect(response.status).toBe(200);
                    expect(response.body.data).toHaveLength(3);
                    expect(response.body.pagination).toEqual({
                        page: 5,
                        limit: 3,
                        total: 30,
                        totalPages: 10,
                        hasNext: true,
                        hasPrev: true,
                    });
                });
            });
        });

        describe("PUT cases", () => {
            it("should update a yarn successfully", async () => {
                const yarn = await Yarn.create({ name: "Original Name", brand: "Original Brand" });
                const updateData = { name: "Updated Name", brand: "Updated Brand" };

                const response = await request(app).put(`/api/yarns/${yarn._id}`).send(updateData);

                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
                expect(response.body.data._id).toBe(yarn._id.toString());
                expect(response.body.data.name).toBe("Updated Name");
                expect(response.body.data.brand).toBe("Updated Brand");
            });

            it("should update yarn numeric fields", async () => {
                const yarn = await Yarn.create({ name: "Test Yarn", quantityInStash: 1 });
                const updateData = { quantityInStash: 10, pricePerUnit: 25.99 };

                const response = await request(app).put(`/api/yarns/${yarn._id}`).send(updateData);

                expect(response.status).toBe(200);
                expect(response.body.data.quantityInStash).toBe(10);
                expect(response.body.data.pricePerUnit).toBe(25.99);
            });

            it("should partially update yarn fields", async () => {
                const yarn = await Yarn.create({
                    name: "Test Yarn",
                    brand: "Original Brand",
                    color: "Red"
                });
                const updateData = { color: "Blue" };

                const response = await request(app).put(`/api/yarns/${yarn._id}`).send(updateData);

                expect(response.status).toBe(200);
                expect(response.body.data.name).toBe("Test Yarn");
                expect(response.body.data.brand).toBe("Original Brand");
                expect(response.body.data.color).toBe("Blue");
            });
        });

        describe("DELETE cases", () => {
            it("should delete a yarn successfully", async () => {
                const yarn = await Yarn.create({ name: "To Be Deleted", brand: "Test Brand" });

                const response = await request(app).delete(`/api/yarns/${yarn._id}`);

                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
                expect(response.body.message).toBe("Yarn deleted successfully");

                const dbYarn = await Yarn.findById(yarn._id);
                expect(dbYarn).toBeNull();
            });
        });

        describe("POST /:id/photos cases", () => {
            it("should add a photo to a yarn", async () => {
                const yarn = await Yarn.create({ name: "Yarn with Photo" });
                const photoData = {
                    filePath: "/uploads/yarn-photo.jpg",
                    isPrimary: true,
                    caption: "Beautiful yarn",
                };

                const response = await request(app)
                    .post(`/api/yarns/${yarn._id}/photos`)
                    .send(photoData)
                    .expect(201);

                expect(response.body.success).toBe(true);
                expect(response.body.message).toBe("Photo added successfully");
                expect(response.body.data.photos).toHaveLength(1);
                expect(response.body.data.photos[0].filePath).toBe("/uploads/yarn-photo.jpg");
                expect(response.body.data.photos[0].isPrimary).toBe(true);
                expect(response.body.data.photos[0].caption).toBe("Beautiful yarn");
            });

            it("should add multiple photos to a yarn", async () => {
                const yarn = await Yarn.create({ name: "Yarn with Multiple Photos" });

                await request(app)
                    .post(`/api/yarns/${yarn._id}/photos`)
                    .send({ filePath: "/uploads/photo1.jpg" })
                    .expect(201);

                const response = await request(app)
                    .post(`/api/yarns/${yarn._id}/photos`)
                    .send({ filePath: "/uploads/photo2.jpg", isPrimary: true })
                    .expect(201);

                expect(response.body.data.photos).toHaveLength(2);
            });

            it("should add photo with optional takenAt date", async () => {
                const yarn = await Yarn.create({ name: "Test Yarn" });
                const photoData = {
                    filePath: "/uploads/photo.jpg",
                    takenAt: "2024-01-15T12:00:00.000Z",
                };

                const response = await request(app)
                    .post(`/api/yarns/${yarn._id}/photos`)
                    .send(photoData)
                    .expect(201);

                expect(response.body.data.photos[0].takenAt).toBe("2024-01-15T12:00:00.000Z");
            });
        });
    });

    describe("Validation Failure Cases", () => {
        describe("POST cases", () => {
            it("should fail when name is missing", async () => {
                const yarnData = {
                    brand: "Test Brand",
                };

                const response = await request(app).post("/api/yarns").send(yarnData).expect(400);

                expect(response.body.success).toBe(false);
                expect(response.body.message).toBe("Validation error");
            });

            it("should fail when name is empty string", async () => {
                const yarnData = {
                    name: "",
                };

                const response = await request(app).post("/api/yarns").send(yarnData).expect(400);

                expect(response.body.success).toBe(false);
            });

            it("should fail when name exceeds 200 characters", async () => {
                const yarnData = {
                    name: "a".repeat(201),
                };

                const response = await request(app).post("/api/yarns").send(yarnData).expect(400);

                expect(response.body.success).toBe(false);
            });

            it("should fail when brand exceeds 200 characters", async () => {
                const yarnData = {
                    name: "Test Yarn",
                    brand: "a".repeat(201),
                };

                const response = await request(app).post("/api/yarns").send(yarnData).expect(400);

                expect(response.body.success).toBe(false);
            });

            it("should fail when yarnType exceeds 100 characters", async () => {
                const yarnData = {
                    name: "Test Yarn",
                    yarnType: "a".repeat(101),
                };

                const response = await request(app).post("/api/yarns").send(yarnData).expect(400);

                expect(response.body.success).toBe(false);
            });

            it("should fail when fiberContent exceeds 500 characters", async () => {
                const yarnData = {
                    name: "Test Yarn",
                    fiberContent: "a".repeat(501),
                };

                const response = await request(app).post("/api/yarns").send(yarnData).expect(400);

                expect(response.body.success).toBe(false);
            });

            it("should fail when notes exceed 2000 characters", async () => {
                const yarnData = {
                    name: "Test Yarn",
                    notes: "a".repeat(2001),
                };

                const response = await request(app).post("/api/yarns").send(yarnData).expect(400);

                expect(response.body.success).toBe(false);
            });

            it("should fail when length is negative", async () => {
                const yarnData = {
                    name: "Test Yarn",
                    length: -10,
                };

                const response = await request(app).post("/api/yarns").send(yarnData).expect(400);

                expect(response.body.success).toBe(false);
            });

            it("should fail when weight is negative", async () => {
                const yarnData = {
                    name: "Test Yarn",
                    weight: -5,
                };

                const response = await request(app).post("/api/yarns").send(yarnData).expect(400);

                expect(response.body.success).toBe(false);
            });

            it("should fail when pricePerUnit is negative", async () => {
                const yarnData = {
                    name: "Test Yarn",
                    pricePerUnit: -12.99,
                };

                const response = await request(app).post("/api/yarns").send(yarnData).expect(400);

                expect(response.body.success).toBe(false);
            });

            it("should fail when quantityInStash is negative", async () => {
                const yarnData = {
                    name: "Test Yarn",
                    quantityInStash: -1,
                };

                const response = await request(app).post("/api/yarns").send(yarnData).expect(400);

                expect(response.body.success).toBe(false);
            });

            it("should fail when quantityInStash is not an integer", async () => {
                const yarnData = {
                    name: "Test Yarn",
                    quantityInStash: 2.5,
                };

                const response = await request(app).post("/api/yarns").send(yarnData).expect(400);

                expect(response.body.success).toBe(false);
            });

            it("should fail when purchaseDate format is invalid", async () => {
                const yarnData = {
                    name: "Test Yarn",
                    purchaseDate: "not-a-date",
                };

                const response = await request(app).post("/api/yarns").send(yarnData).expect(400);

                expect(response.body.success).toBe(false);
            });
        });

        describe("GET cases", () => {
            it("should return 404 for a non-existent yarn ID", async () => {
                const validNonExistentId = new mongoose.Types.ObjectId();
                const response = await request(app).get(`/api/yarns/${validNonExistentId}`);

                expect(response.status).toBe(404);
                expect(response.body.success).toBe(false);
                expect(response.body.message).toBe("Yarn not found");
            });

            it("should return 400 for an invalid yarn ID", async () => {
                const invalidId = "123-invalid-id";
                const response = await request(app).get(`/api/yarns/${invalidId}`);

                expect(response.status).toBe(400);
                expect(response.body.success).toBe(false);
                expect(response.body.message).toContain(`Invalid _id: ${invalidId}`);
            });
        });

        describe("PUT cases", () => {
            it("should return 400 when update body is empty", async () => {
                const yarn = await Yarn.create({ name: "Test Yarn" });
                const updateData = {};

                const response = await request(app).put(`/api/yarns/${yarn._id}`).send(updateData);

                expect(response.status).toBe(400);
                expect(response.body.success).toBe(false);
            });

            it("should return 400 for invalid update data", async () => {
                const yarn = await Yarn.create({ name: "Test Yarn" });
                const updateData = { lengthMeters: -100 };

                const response = await request(app).put(`/api/yarns/${yarn._id}`).send(updateData);

                expect(response.status).toBe(400);
                expect(response.body.success).toBe(false);
            });

            it("should return 404 when updating a non-existent yarn", async () => {
                const validNonExistentId = new mongoose.Types.ObjectId();
                const updateData = { name: "Updated Name" };

                const response = await request(app).put(`/api/yarns/${validNonExistentId}`).send(updateData);

                expect(response.status).toBe(404);
                expect(response.body.success).toBe(false);
                expect(response.body.message).toBe("Yarn not found");
            });

            it("should return 400 when name exceeds max length in update", async () => {
                const yarn = await Yarn.create({ name: "Test Yarn" });
                const updateData = { name: "a".repeat(201) };

                const response = await request(app).put(`/api/yarns/${yarn._id}`).send(updateData);

                expect(response.status).toBe(400);
                expect(response.body.success).toBe(false);
            });
        });

        describe("DELETE cases", () => {
            it("should return 404 when deleting a non-existent yarn", async () => {
                const validNonExistentId = new mongoose.Types.ObjectId();

                const response = await request(app).delete(`/api/yarns/${validNonExistentId}`);

                expect(response.status).toBe(404);
                expect(response.body.success).toBe(false);
                expect(response.body.message).toBe("Yarn not found");
            });

            it("should return 400 when deleting with invalid ID", async () => {
                const invalidId = "invalid-id-format";

                const response = await request(app).delete(`/api/yarns/${invalidId}`);

                expect(response.status).toBe(400);
                expect(response.body.success).toBe(false);
            });
        });

        describe("POST /:id/photos cases", () => {
            it("should fail when filePath is missing", async () => {
                const yarn = await Yarn.create({ name: "Test Yarn" });
                const photoData = {
                    isPrimary: true,
                };

                const response = await request(app)
                    .post(`/api/yarns/${yarn._id}/photos`)
                    .send(photoData)
                    .expect(400);

                expect(response.body.success).toBe(false);
            });

            it("should fail when filePath is empty", async () => {
                const yarn = await Yarn.create({ name: "Test Yarn" });
                const photoData = {
                    filePath: "",
                };

                const response = await request(app)
                    .post(`/api/yarns/${yarn._id}/photos`)
                    .send(photoData)
                    .expect(400);

                expect(response.body.success).toBe(false);
            });

            it("should fail when caption exceeds 500 characters", async () => {
                const yarn = await Yarn.create({ name: "Test Yarn" });
                const photoData = {
                    filePath: "/uploads/photo.jpg",
                    caption: "a".repeat(501),
                };

                const response = await request(app)
                    .post(`/api/yarns/${yarn._id}/photos`)
                    .send(photoData)
                    .expect(400);

                expect(response.body.success).toBe(false);
            });

            it("should fail when takenAt has invalid date format", async () => {
                const yarn = await Yarn.create({ name: "Test Yarn" });
                const photoData = {
                    filePath: "/uploads/photo.jpg",
                    takenAt: "invalid-date",
                };

                const response = await request(app)
                    .post(`/api/yarns/${yarn._id}/photos`)
                    .send(photoData)
                    .expect(400);

                expect(response.body.success).toBe(false);
            });

            it("should return 404 when adding photo to non-existent yarn", async () => {
                const validNonExistentId = new mongoose.Types.ObjectId();
                const photoData = {
                    filePath: "/uploads/photo.jpg",
                };

                const response = await request(app)
                    .post(`/api/yarns/${validNonExistentId}/photos`)
                    .send(photoData)
                    .expect(404);

                expect(response.body.success).toBe(false);
                expect(response.body.message).toBe("Yarn not found");
            });
        });
    });

    describe("Database Persistence", () => {
        it("should persist timestamps correctly", async () => {
            const yarnData = {
                name: "Timestamp Test",
            };

            const response = await request(app).post("/api/yarns").send(yarnData).expect(201);

            expect(response.body.data).toHaveProperty("createdAt");
            expect(response.body.data).toHaveProperty("updatedAt");

            const createdAt = new Date(response.body.data.createdAt);
            const updatedAt = new Date(response.body.data.updatedAt);

            expect(createdAt).toBeInstanceOf(Date);
            expect(updatedAt).toBeInstanceOf(Date);
        });

        it("should initialize empty arrays for photos and links", async () => {
            const yarnData = {
                name: "Array Test",
            };

            const response = await request(app).post("/api/yarns").send(yarnData).expect(201);

            const yarnInDb = await Yarn.findById(response.body.data._id);

            expect(Array.isArray(yarnInDb.photos)).toBe(true);
            expect(yarnInDb.photos.length).toBe(0);
            expect(Array.isArray(yarnInDb.links)).toBe(true);
            expect(yarnInDb.links.length).toBe(0);
        });

        it("should set default currency to EUR", async () => {
            const yarnData = {
                name: "Default Currency Test",
            };

            const response = await request(app).post("/api/yarns").send(yarnData).expect(201);

            expect(response.body.data.currency).toBe("EUR");
        });

        it("should set default quantityInStash to 1", async () => {
            const yarnData = {
                name: "Default Quantity Test",
            };

            const response = await request(app).post("/api/yarns").send(yarnData).expect(201);

            expect(response.body.data.quantityInStash).toBe(1);
        });

        it("should update updatedAt timestamp on update", async () => {
            const yarn = await Yarn.create({ name: "Original Name" });
            const originalUpdatedAt = yarn.updatedAt;

            await new Promise((resolve) => setTimeout(resolve, 10));

            const response = await request(app)
                .put(`/api/yarns/${yarn._id}`)
                .send({ name: "Updated Name" })
                .expect(200);

            const updatedAt = new Date(response.body.data.updatedAt);
            expect(updatedAt > originalUpdatedAt).toBe(true);
        });
    });

    describe("Edge Cases", () => {
        it("should handle yarn with zero numeric values", async () => {
            const yarnData = {
                name: "Zero Values Yarn",
                length: 0,
                weight: 0,
                pricePerUnit: 0,
                quantityInStash: 0,
            };

            const response = await request(app).post("/api/yarns").send(yarnData).expect(201);

            expect(response.body.data.length).toBe(0);
            expect(response.body.data.weight).toBe(0);
            expect(response.body.data.pricePerUnit).toBe(0);
            expect(response.body.data.quantityInStash).toBe(0);
        });

        it("should handle yarn with very long valid strings", async () => {
            const yarnData = {
                name: "a".repeat(200),
                brand: "b".repeat(200),
                fiberContent: "c".repeat(500),
                notes: "d".repeat(2000),
            };

            const response = await request(app).post("/api/yarns").send(yarnData).expect(201);

            expect(response.body.data.name).toHaveLength(200);
            expect(response.body.data.brand).toHaveLength(200);
            expect(response.body.data.fiberContent).toHaveLength(500);
            expect(response.body.data.notes).toHaveLength(2000);
        });

        it("should handle empty notes field", async () => {
            const yarnData = {
                name: "Yarn with Empty Notes",
                notes: "",
            };

            const response = await request(app).post("/api/yarns").send(yarnData).expect(201);

            expect(response.body.data.notes).toBe("");
        });

        it("should handle special characters in text fields", async () => {
            const yarnData = {
                name: "Yarn with Special Chars: !@#$%^&*()",
                brand: "Brand <>&",
                notes: "Notes with 'quotes' and \"double quotes\"",
            };

            const response = await request(app).post("/api/yarns").send(yarnData).expect(201);

            expect(response.body.data.name).toContain("!@#$%^&*()");
            expect(response.body.data.brand).toContain("<>&");
            expect(response.body.data.notes).toContain("'quotes'");
        });

        it("should handle multiple query parameters at once", async () => {
            await Yarn.create([
                { name: "Red Worsted", brand: "Brand A", yarnType: "Worsted", color: "Red" },
                { name: "Blue Worsted", brand: "Brand A", yarnType: "Worsted", color: "Blue" },
                { name: "Red Fingering", brand: "Brand B", yarnType: "Fingering", color: "Red" },
            ]);

            const response = await request(app).get("/api/yarns?brand=Brand A&yarnType=Worsted&color=Red");

            expect(response.status).toBe(200);
            expect(response.body.pagination.total).toBe(1);
            expect(response.body.data[0].name).toBe("Red Worsted");
        });
    });
});
