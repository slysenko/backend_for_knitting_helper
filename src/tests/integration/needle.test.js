import request from "supertest";
import mongoose from "mongoose";
import app from "../../app.js";
import Needle from "../../models/needle.js";

describe("Needle Routes - Integration Tests", () => {
    describe("Success Cases", () => {
        describe("POST cases", () => {
            it("should create a needle with minimal required fields", async () => {
                const needleData = {
                    sizeMm: 4.0,
                    type: "straight",
                };

                const response = await request(app).post("/api/needles").send(needleData).expect(201);

                expect(response.body.success).toBe(true);
                expect(response.body.message).toBe("Needle created successfully");
                expect(response.body.data).toHaveProperty("_id");
                expect(response.body.data.sizeMm).toBe(4.0);
                expect(response.body.data.type).toBe("straight");
                expect(response.body.data.currency).toBe("EUR");

                const needleInDb = await Needle.findById(response.body.data._id);
                expect(needleInDb).not.toBeNull();
                expect(needleInDb.sizeMm).toBe(4.0);
            });

            it("should create a needle with all optional fields", async () => {
                const needleData = {
                    sizeMm: 3.5,
                    sizeUs: "US 4",
                    type: "circular",
                    lengthCm: 80,
                    material: "Bamboo",
                    brand: "ChiaoGoo",
                    price: 12.99,
                    currency: "USD",
                    notes: "Perfect for sweaters",
                };

                const response = await request(app).post("/api/needles").send(needleData).expect(201);

                expect(response.body.success).toBe(true);
                expect(response.body.data.sizeMm).toBe(3.5);
                expect(response.body.data.sizeUs).toBe("US 4");
                expect(response.body.data.type).toBe("circular");
                expect(response.body.data.lengthCm).toBe(80);
                expect(response.body.data.material).toBe("Bamboo");
                expect(response.body.data.brand).toBe("ChiaoGoo");
                expect(response.body.data.price).toBe(12.99);
                expect(response.body.data.currency).toBe("USD");
                expect(response.body.data.notes).toBe("Perfect for sweaters");
            });

            it("should create needles with different types", async () => {
                const types = ["straight", "circular", "dpn"];

                for (const type of types) {
                    const needleData = {
                        sizeMm: 4.0,
                        type: type,
                    };

                    const response = await request(app).post("/api/needles").send(needleData).expect(201);

                    expect(response.body.data.type).toBe(type);
                }
            });

            it("should create a circular needle with specific length", async () => {
                const needleData = {
                    sizeMm: 3.5,
                    type: "circular",
                    lengthCm: 100,
                };

                const response = await request(app).post("/api/needles").send(needleData).expect(201);

                expect(response.body.data.type).toBe("circular");
                expect(response.body.data.lengthCm).toBe(100);
            });

            it("should create a dpn needle set", async () => {
                const needleData = {
                    sizeMm: 2.5,
                    sizeUs: "US 1.5",
                    type: "dpn",
                    lengthCm: 20,
                    material: "Metal",
                    brand: "Addi",
                };

                const response = await request(app).post("/api/needles").send(needleData).expect(201);

                expect(response.body.data.type).toBe("dpn");
                expect(response.body.data.lengthCm).toBe(20);
                expect(response.body.data.material).toBe("Metal");
            });

            it("should create needle with decimal sizeMm", async () => {
                const needleData = {
                    sizeMm: 3.75,
                    type: "straight",
                };

                const response = await request(app).post("/api/needles").send(needleData).expect(201);

                expect(response.body.data.sizeMm).toBe(3.75);
            });

            it("should create needle with different materials", async () => {
                const materials = ["Bamboo", "Metal", "Wood", "Plastic", "Carbon Fiber"];

                for (const material of materials) {
                    const needleData = {
                        sizeMm: 4.0,
                        type: "straight",
                        material: material,
                    };

                    const response = await request(app).post("/api/needles").send(needleData).expect(201);

                    expect(response.body.data.material).toBe(material);
                }
            });

            it("should create needle with price and currency", async () => {
                const needleData = {
                    sizeMm: 5.0,
                    type: "circular",
                    price: 25.50,
                    currency: "GBP",
                };

                const response = await request(app).post("/api/needles").send(needleData).expect(201);

                expect(response.body.data.price).toBe(25.50);
                expect(response.body.data.currency).toBe("GBP");
            });

            it("should automatically convert lowercase currency to uppercase", async () => {
                const needleData = {
                    sizeMm: 4.0,
                    type: "straight",
                    currency: "usd",
                };

                const response = await request(app).post("/api/needles").send(needleData).expect(201);

                expect(response.body.success).toBe(true);
                expect(response.body.data.currency).toBe("USD");

                const needleInDb = await Needle.findById(response.body.data._id);
                expect(needleInDb.currency).toBe("USD");
            });
        });

        describe("GET cases", () => {
            it("should return an empty array when no needles exist", async () => {
                const response = await request(app).get("/api/needles");

                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
                expect(response.body.data).toEqual([]);
                expect(response.body.pagination).toBeDefined();
                expect(response.body.pagination.total).toBe(0);
            });

            it("should return all needles with default pagination", async () => {
                await Needle.create([
                    { sizeMm: 4.0, type: "straight" },
                    { sizeMm: 3.5, type: "circular" },
                ]);

                const response = await request(app).get("/api/needles");

                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
                expect(response.body.data).toHaveLength(2);
                expect(response.body.pagination).toBeDefined();
                expect(response.body.pagination.total).toBe(2);
                expect(response.body.pagination.page).toBe(1);
                expect(response.body.pagination.limit).toBe(20);
            });

            it("should filter needles by type", async () => {
                await Needle.create([
                    { sizeMm: 4.0, type: "straight" },
                    { sizeMm: 3.5, type: "circular" },
                    { sizeMm: 2.5, type: "dpn" },
                ]);

                const response = await request(app).get("/api/needles?type=circular");

                expect(response.status).toBe(200);
                expect(response.body.data).toHaveLength(1);
                expect(response.body.pagination.total).toBe(1);
                expect(response.body.data[0].type).toBe("circular");
                expect(response.body.data[0].sizeMm).toBe(3.5);
            });

            it("should filter needles by sizeMm", async () => {
                await Needle.create([
                    { sizeMm: 4.0, type: "straight" },
                    { sizeMm: 4.0, type: "circular" },
                    { sizeMm: 3.5, type: "straight" },
                ]);

                const response = await request(app).get("/api/needles?sizeMm=4.0");

                expect(response.status).toBe(200);
                expect(response.body.data).toHaveLength(2);
                expect(response.body.pagination.total).toBe(2);
                expect(response.body.data.every((n) => n.sizeMm === 4.0)).toBe(true);
            });

            it("should filter needles by material", async () => {
                await Needle.create([
                    { sizeMm: 4.0, type: "straight", material: "Bamboo" },
                    { sizeMm: 3.5, type: "circular", material: "Metal" },
                ]);

                const response = await request(app).get("/api/needles?material=Bamboo");

                expect(response.status).toBe(200);
                expect(response.body.data).toHaveLength(1);
                expect(response.body.pagination.total).toBe(1);
                expect(response.body.data[0].material).toBe("Bamboo");
            });

            it("should filter needles by brand", async () => {
                await Needle.create([
                    { sizeMm: 4.0, type: "straight", brand: "ChiaoGoo" },
                    { sizeMm: 3.5, type: "circular", brand: "Addi" },
                ]);

                const response = await request(app).get("/api/needles?brand=ChiaoGoo");

                expect(response.status).toBe(200);
                expect(response.body.data).toHaveLength(1);
                expect(response.body.pagination.total).toBe(1);
                expect(response.body.data[0].brand).toBe("ChiaoGoo");
            });

            it("should return a single needle by its ID", async () => {
                const needle = await Needle.create({ sizeMm: 4.0, type: "straight" });

                const response = await request(app).get(`/api/needles/${needle._id}`);

                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
                expect(response.body.data._id).toBe(needle._id.toString());
                expect(response.body.data.sizeMm).toBe(4.0);
            });

            it("should return needles sorted by sizeMm in ascending order", async () => {
                await Needle.create([
                    { sizeMm: 5.0, type: "straight" },
                    { sizeMm: 2.5, type: "circular" },
                    { sizeMm: 4.0, type: "dpn" },
                ]);

                const response = await request(app).get("/api/needles");

                expect(response.status).toBe(200);
                expect(response.body.data[0].sizeMm).toBe(2.5);
                expect(response.body.data[1].sizeMm).toBe(4.0);
                expect(response.body.data[2].sizeMm).toBe(5.0);
            });

            describe("Pagination", () => {
                beforeEach(async () => {
                    // Create 30 needles for pagination testing
                    const needles = [];
                    for (let i = 1; i <= 30; i++) {
                        needles.push({
                            sizeMm: i * 0.5,
                            type: i % 3 === 0 ? "dpn" : i % 2 === 0 ? "circular" : "straight",
                            material: i % 2 === 0 ? "Metal" : "Bamboo",
                        });
                    }
                    await Needle.create(needles);
                });

                it("should paginate needles with default limit (20)", async () => {
                    const response = await request(app).get("/api/needles?page=1");

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

                it("should return second page of needles", async () => {
                    const response = await request(app).get("/api/needles?page=2&limit=20");

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
                    const response = await request(app).get("/api/needles?page=1&limit=10");

                    expect(response.status).toBe(200);
                    expect(response.body.data).toHaveLength(10);
                    expect(response.body.pagination).toEqual({
                        page: 1,
                        limit: 10,
                        total: 30,
                        totalPages: 3,
                        hasNext: true,
                        hasPrev: false,
                    });
                });

                it("should return third page with custom limit", async () => {
                    const response = await request(app).get("/api/needles?page=3&limit=10");

                    expect(response.status).toBe(200);
                    expect(response.body.data).toHaveLength(10);
                    expect(response.body.pagination).toEqual({
                        page: 3,
                        limit: 10,
                        total: 30,
                        totalPages: 3,
                        hasNext: false,
                        hasPrev: true,
                    });
                });

                it("should handle page beyond available data", async () => {
                    const response = await request(app).get("/api/needles?page=10&limit=20");

                    expect(response.status).toBe(200);
                    expect(response.body.data).toHaveLength(0);
                    expect(response.body.pagination.page).toBe(10);
                    expect(response.body.pagination.total).toBe(30);
                });

                it("should combine pagination with filters (type)", async () => {
                    const response = await request(app).get("/api/needles?type=straight&page=1&limit=5");

                    expect(response.status).toBe(200);
                    expect(response.body.data.every((n) => n.type === "straight")).toBe(true);
                });

                it("should combine pagination with filters (material)", async () => {
                    const response = await request(app).get("/api/needles?material=Metal&page=1&limit=10");

                    expect(response.status).toBe(200);
                    expect(response.body.data.every((n) => n.material === "Metal")).toBe(true);
                    expect(response.body.pagination.total).toBe(15); // 15 Metal needles
                });

                it("should combine pagination with multiple filters", async () => {
                    const response = await request(app).get("/api/needles?type=circular&material=Metal&page=1&limit=5");

                    expect(response.status).toBe(200);
                    expect(response.body.data.every((n) => n.type === "circular" && n.material === "Metal")).toBe(true);
                });

                it("should handle invalid page number (negative)", async () => {
                    const response = await request(app).get("/api/needles?page=-1");

                    expect(response.status).toBe(200);
                    expect(response.body.pagination.page).toBe(1); // Should default to page 1
                });

                it("should handle invalid page number (zero)", async () => {
                    const response = await request(app).get("/api/needles?page=0");

                    expect(response.status).toBe(200);
                    expect(response.body.pagination.page).toBe(1); // Should default to page 1
                });

                it("should cap limit at maximum (100)", async () => {
                    const response = await request(app).get("/api/needles?limit=500");

                    expect(response.status).toBe(200);
                    expect(response.body.pagination.limit).toBe(100); // Should cap at 100
                });

                it("should handle non-numeric page parameter", async () => {
                    const response = await request(app).get("/api/needles?page=abc");

                    expect(response.status).toBe(200);
                    expect(response.body.pagination.page).toBe(1); // Should default to page 1
                });

                it("should handle non-numeric limit parameter", async () => {
                    const response = await request(app).get("/api/needles?limit=xyz");

                    expect(response.status).toBe(200);
                    expect(response.body.pagination.limit).toBe(20); // Should default to 20
                });

                it("should not interfere with needle filters (page and limit should be excluded from query)", async () => {
                    const response = await request(app).get("/api/needles?page=1&limit=10&type=straight");

                    expect(response.status).toBe(200);
                    // Should filter by type, not treat page/limit as filter fields
                    expect(response.body.data.every((n) => n.type === "straight")).toBe(true);
                });
            });
        });

        describe("PUT cases", () => {
            it("should update a needle successfully", async () => {
                const needle = await Needle.create({ sizeMm: 4.0, type: "straight" });
                const updateData = { material: "Bamboo", brand: "ChiaoGoo" };

                const response = await request(app).put(`/api/needles/${needle._id}`).send(updateData);

                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
                expect(response.body.data._id).toBe(needle._id.toString());
                expect(response.body.data.material).toBe("Bamboo");
                expect(response.body.data.brand).toBe("ChiaoGoo");
            });

            it("should update needle numeric fields", async () => {
                const needle = await Needle.create({ sizeMm: 4.0, type: "circular" });
                const updateData = { lengthCm: 100, price: 15.99 };

                const response = await request(app).put(`/api/needles/${needle._id}`).send(updateData);

                expect(response.status).toBe(200);
                expect(response.body.data.lengthCm).toBe(100);
                expect(response.body.data.price).toBe(15.99);
            });

            it("should partially update needle fields", async () => {
                const needle = await Needle.create({
                    sizeMm: 4.0,
                    type: "straight",
                    material: "Metal",
                });
                const updateData = { notes: "My favorite needles" };

                const response = await request(app).put(`/api/needles/${needle._id}`).send(updateData);

                expect(response.status).toBe(200);
                expect(response.body.data.sizeMm).toBe(4.0);
                expect(response.body.data.type).toBe("straight");
                expect(response.body.data.material).toBe("Metal");
                expect(response.body.data.notes).toBe("My favorite needles");
            });
        });

        describe("DELETE cases", () => {
            it("should delete a needle successfully", async () => {
                const needle = await Needle.create({ sizeMm: 4.0, type: "straight" });

                const response = await request(app).delete(`/api/needles/${needle._id}`);

                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
                expect(response.body.message).toBe("Needle deleted successfully");

                const dbNeedle = await Needle.findById(needle._id);
                expect(dbNeedle).toBeNull();
            });
        });
    });

    describe("Validation Failure Cases", () => {
        describe("POST cases", () => {
            it("should fail when sizeMm is missing", async () => {
                const needleData = {
                    type: "straight",
                };

                const response = await request(app).post("/api/needles").send(needleData).expect(400);

                expect(response.body.success).toBe(false);
                expect(response.body.message).toBe("Validation error");
            });

            it("should fail when type is missing", async () => {
                const needleData = {
                    sizeMm: 4.0,
                };

                const response = await request(app).post("/api/needles").send(needleData).expect(400);

                expect(response.body.success).toBe(false);
            });

            it("should fail when sizeMm is negative", async () => {
                const needleData = {
                    sizeMm: -4.0,
                    type: "straight",
                };

                const response = await request(app).post("/api/needles").send(needleData).expect(400);

                expect(response.body.success).toBe(false);
            });

            it("should fail when sizeMm is zero", async () => {
                const needleData = {
                    sizeMm: 0,
                    type: "straight",
                };

                const response = await request(app).post("/api/needles").send(needleData).expect(400);

                expect(response.body.success).toBe(false);
            });

            it("should fail when type is invalid", async () => {
                const needleData = {
                    sizeMm: 4.0,
                    type: "crochet", // invalid type
                };

                const response = await request(app).post("/api/needles").send(needleData).expect(400);

                expect(response.body.success).toBe(false);
                expect(response.body.errors[0].message).toContain('"type" must be one of [straight, circular, dpn]');
            });

            it("should fail when lengthCm is negative", async () => {
                const needleData = {
                    sizeMm: 4.0,
                    type: "circular",
                    lengthCm: -80,
                };

                const response = await request(app).post("/api/needles").send(needleData).expect(400);

                expect(response.body.success).toBe(false);
            });

            it("should fail when lengthCm is zero", async () => {
                const needleData = {
                    sizeMm: 4.0,
                    type: "circular",
                    lengthCm: 0,
                };

                const response = await request(app).post("/api/needles").send(needleData).expect(400);

                expect(response.body.success).toBe(false);
            });

            it("should fail when price is negative", async () => {
                const needleData = {
                    sizeMm: 4.0,
                    type: "straight",
                    price: -12.99,
                };

                const response = await request(app).post("/api/needles").send(needleData).expect(400);

                expect(response.body.success).toBe(false);
            });

            it("should fail when currency is not 3 characters", async () => {
                const needleData = {
                    sizeMm: 4.0,
                    type: "straight",
                    currency: "DOLLAR",
                };

                const response = await request(app).post("/api/needles").send(needleData).expect(400);

                expect(response.body.success).toBe(false);
            });

            it("should fail when notes exceed 2000 characters", async () => {
                const needleData = {
                    sizeMm: 4.0,
                    type: "straight",
                    notes: "a".repeat(2001),
                };

                const response = await request(app).post("/api/needles").send(needleData).expect(400);

                expect(response.body.success).toBe(false);
            });

            it("should fail when sizeUs exceeds 20 characters", async () => {
                const needleData = {
                    sizeMm: 4.0,
                    type: "straight",
                    sizeUs: "a".repeat(21),
                };

                const response = await request(app).post("/api/needles").send(needleData).expect(400);

                expect(response.body.success).toBe(false);
            });

            it("should fail when material exceeds 100 characters", async () => {
                const needleData = {
                    sizeMm: 4.0,
                    type: "straight",
                    material: "a".repeat(101),
                };

                const response = await request(app).post("/api/needles").send(needleData).expect(400);

                expect(response.body.success).toBe(false);
            });

            it("should fail when brand exceeds 200 characters", async () => {
                const needleData = {
                    sizeMm: 4.0,
                    type: "straight",
                    brand: "a".repeat(201),
                };

                const response = await request(app).post("/api/needles").send(needleData).expect(400);

                expect(response.body.success).toBe(false);
            });
        });

        describe("GET cases", () => {
            it("should return 400 for invalid query param (type)", async () => {
                const response = await request(app).get("/api/needles?type=crochet");

                expect(response.status).toBe(400);
                expect(response.body.success).toBe(false);
                expect(response.body.errors[0].message).toContain('"type" must be one of [straight, circular, dpn]');
            });

            it("should return 400 for invalid sizeMm (negative)", async () => {
                const response = await request(app).get("/api/needles?sizeMm=-4");

                expect(response.status).toBe(400);
                expect(response.body.success).toBe(false);
            });

            it("should return 404 for a non-existent needle ID", async () => {
                const validNonExistentId = new mongoose.Types.ObjectId();
                const response = await request(app).get(`/api/needles/${validNonExistentId}`);

                expect(response.status).toBe(404);
                expect(response.body.success).toBe(false);
                expect(response.body.message).toBe("Needle not found");
            });

            it("should return 400 for an invalid needle ID", async () => {
                const invalidId = "123-invalid-id";
                const response = await request(app).get(`/api/needles/${invalidId}`);

                expect(response.status).toBe(400);
                expect(response.body.success).toBe(false);
                expect(response.body.message).toContain(`Invalid _id: ${invalidId}`);
            });
        });

        describe("PUT cases", () => {
            it("should return 400 when update body is empty", async () => {
                const needle = await Needle.create({ sizeMm: 4.0, type: "straight" });
                const updateData = {};

                const response = await request(app).put(`/api/needles/${needle._id}`).send(updateData);

                expect(response.status).toBe(400);
                expect(response.body.success).toBe(false);
            });

            it("should return 400 for invalid update data (negative sizeMm)", async () => {
                const needle = await Needle.create({ sizeMm: 4.0, type: "straight" });
                const updateData = { sizeMm: -5.0 };

                const response = await request(app).put(`/api/needles/${needle._id}`).send(updateData);

                expect(response.status).toBe(400);
                expect(response.body.success).toBe(false);
            });

            it("should return 400 for invalid type in update", async () => {
                const needle = await Needle.create({ sizeMm: 4.0, type: "straight" });
                const updateData = { type: "invalid_type" };

                const response = await request(app).put(`/api/needles/${needle._id}`).send(updateData);

                expect(response.status).toBe(400);
                expect(response.body.success).toBe(false);
            });

            it("should return 404 when updating a non-existent needle", async () => {
                const validNonExistentId = new mongoose.Types.ObjectId();
                const updateData = { material: "Bamboo" };

                const response = await request(app).put(`/api/needles/${validNonExistentId}`).send(updateData);

                expect(response.status).toBe(404);
                expect(response.body.success).toBe(false);
                expect(response.body.message).toBe("Needle not found");
            });

            it("should return 400 when brand exceeds max length in update", async () => {
                const needle = await Needle.create({ sizeMm: 4.0, type: "straight" });
                const updateData = { brand: "a".repeat(201) };

                const response = await request(app).put(`/api/needles/${needle._id}`).send(updateData);

                expect(response.status).toBe(400);
                expect(response.body.success).toBe(false);
            });
        });

        describe("DELETE cases", () => {
            it("should return 404 when deleting a non-existent needle", async () => {
                const validNonExistentId = new mongoose.Types.ObjectId();

                const response = await request(app).delete(`/api/needles/${validNonExistentId}`);

                expect(response.status).toBe(404);
                expect(response.body.success).toBe(false);
                expect(response.body.message).toBe("Needle not found");
            });

            it("should return 400 when deleting with invalid ID", async () => {
                const invalidId = "invalid-id-format";

                const response = await request(app).delete(`/api/needles/${invalidId}`);

                expect(response.status).toBe(400);
                expect(response.body.success).toBe(false);
            });
        });
    });

    describe("Database Persistence", () => {
        it("should persist timestamps correctly", async () => {
            const needleData = {
                sizeMm: 4.0,
                type: "straight",
            };

            const response = await request(app).post("/api/needles").send(needleData).expect(201);

            expect(response.body.data).toHaveProperty("createdAt");
            expect(response.body.data.createdAt).toBeDefined();

            const createdAt = new Date(response.body.data.createdAt);
            expect(createdAt).toBeInstanceOf(Date);
        });

        it("should set default currency to EUR", async () => {
            const needleData = {
                sizeMm: 4.0,
                type: "straight",
            };

            const response = await request(app).post("/api/needles").send(needleData).expect(201);

            expect(response.body.data.currency).toBe("EUR");
        });

        it("should not have updatedAt timestamp (timestamps: { updatedAt: false })", async () => {
            const needleData = {
                sizeMm: 4.0,
                type: "straight",
            };

            const response = await request(app).post("/api/needles").send(needleData).expect(201);

            expect(response.body.data.updatedAt).toBeUndefined();
        });
    });

    describe("Edge Cases", () => {
        it("should handle needle with zero price", async () => {
            const needleData = {
                sizeMm: 4.0,
                type: "straight",
                price: 0,
            };

            const response = await request(app).post("/api/needles").send(needleData).expect(201);

            expect(response.body.data.price).toBe(0);
        });

        it("should handle needle with very long valid strings", async () => {
            const needleData = {
                sizeMm: 4.0,
                type: "straight",
                sizeUs: "a".repeat(20),
                material: "b".repeat(100),
                brand: "c".repeat(200),
                notes: "d".repeat(2000),
            };

            const response = await request(app).post("/api/needles").send(needleData).expect(201);

            expect(response.body.data.sizeUs).toHaveLength(20);
            expect(response.body.data.material).toHaveLength(100);
            expect(response.body.data.brand).toHaveLength(200);
            expect(response.body.data.notes).toHaveLength(2000);
        });

        it("should handle empty notes field", async () => {
            const needleData = {
                sizeMm: 4.0,
                type: "straight",
                notes: "",
            };

            const response = await request(app).post("/api/needles").send(needleData).expect(201);

            expect(response.body.data.notes).toBe("");
        });

        it("should handle special characters in text fields", async () => {
            const needleData = {
                sizeMm: 4.0,
                type: "straight",
                sizeUs: "US 6 (4mm)",
                brand: "ChiaoGoo & Addi",
                notes: "Notes with 'quotes' and \"double quotes\"",
            };

            const response = await request(app).post("/api/needles").send(needleData).expect(201);

            expect(response.body.data.sizeUs).toContain("US 6");
            expect(response.body.data.brand).toContain("&");
            expect(response.body.data.notes).toContain("'quotes'");
        });

        it("should handle multiple query parameters at once", async () => {
            await Needle.create([
                { sizeMm: 4.0, type: "straight", material: "Bamboo", brand: "ChiaoGoo" },
                { sizeMm: 4.0, type: "circular", material: "Metal", brand: "Addi" },
                { sizeMm: 3.5, type: "straight", material: "Bamboo", brand: "ChiaoGoo" },
            ]);

            const response = await request(app).get("/api/needles?sizeMm=4.0&type=straight&material=Bamboo");

            expect(response.status).toBe(200);
            expect(response.body.pagination.total).toBe(1);
            expect(response.body.data[0].sizeMm).toBe(4.0);
            expect(response.body.data[0].type).toBe("straight");
            expect(response.body.data[0].material).toBe("Bamboo");
        });

        it("should handle very small sizeMm values", async () => {
            const needleData = {
                sizeMm: 0.5,
                type: "dpn",
            };

            const response = await request(app).post("/api/needles").send(needleData).expect(201);

            expect(response.body.data.sizeMm).toBe(0.5);
        });

        it("should handle very large sizeMm values", async () => {
            const needleData = {
                sizeMm: 25.0,
                type: "straight",
            };

            const response = await request(app).post("/api/needles").send(needleData).expect(201);

            expect(response.body.data.sizeMm).toBe(25.0);
        });

        it("should handle decimal lengthCm values", async () => {
            const needleData = {
                sizeMm: 4.0,
                type: "circular",
                lengthCm: 80.5,
            };

            const response = await request(app).post("/api/needles").send(needleData).expect(201);

            expect(response.body.data.lengthCm).toBe(80.5);
        });
    });
});
