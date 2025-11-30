import request from "supertest";
import mongoose from "mongoose";
import app from "../../app.js";
import Hook from "../../models/hook.js";
import Project from "../../models/project.js";

describe("Hook Routes - Integration Tests", () => {
    describe("Success Cases", () => {
        describe("POST cases", () => {
            it("should create a hook with minimal required fields", async () => {
                const hookData = {
                    sizeMm: 5.0,
                };

                const response = await request(app).post("/api/hooks").send(hookData).expect(201);

                expect(response.body.success).toBe(true);
                expect(response.body.message).toBe("Hook created successfully");
                expect(response.body.data).toHaveProperty("_id");
                expect(response.body.data.sizeMm).toBe(5.0);
                expect(response.body.data.currency).toBe("EUR");

                const hookInDb = await Hook.findById(response.body.data._id);
                expect(hookInDb).not.toBeNull();
                expect(hookInDb.sizeMm).toBe(5.0);
            });

            it("should create a hook with all optional fields", async () => {
                const hookData = {
                    sizeMm: 6.0,
                    sizeUs: "J/10",
                    material: "Aluminum",
                    brand: "Clover",
                    price: 8.99,
                    currency: "USD",
                    notes: "Ergonomic handle, very comfortable to use",
                };

                const response = await request(app).post("/api/hooks").send(hookData).expect(201);

                expect(response.body.success).toBe(true);
                expect(response.body.data.sizeMm).toBe(6.0);
                expect(response.body.data.sizeUs).toBe("J/10");
                expect(response.body.data.material).toBe("Aluminum");
                expect(response.body.data.brand).toBe("Clover");
                expect(response.body.data.price).toBe(8.99);
                expect(response.body.data.currency).toBe("USD");
                expect(response.body.data.notes).toBe("Ergonomic handle, very comfortable to use");
            });

            it("should create hooks with different materials", async () => {
                const materials = ["Aluminum", "Steel", "Bamboo", "Plastic", "Wooden"];

                for (const material of materials) {
                    const hookData = {
                        sizeMm: 3.5 + materials.indexOf(material),
                        material: material,
                    };

                    const response = await request(app).post("/api/hooks").send(hookData).expect(201);

                    expect(response.body.data.material).toBe(material);
                }
            });

            it("should create hook with decimal sizeMm", async () => {
                const hookData = {
                    sizeMm: 4.5,
                    sizeUs: "7",
                };

                const response = await request(app).post("/api/hooks").send(hookData).expect(201);

                expect(response.body.data.sizeMm).toBe(4.5);
                expect(response.body.data.sizeUs).toBe("7");
            });

            it("should create hook with different US sizes", async () => {
                const usSizes = ["B/1", "C/2", "D/3", "E/4", "F/5", "G/6", "H/8", "I/9", "J/10", "K/10.5", "L/11"];

                for (const sizeUs of usSizes) {
                    const hookData = {
                        sizeMm: 2.25 + usSizes.indexOf(sizeUs) * 0.5,
                        sizeUs: sizeUs,
                    };

                    const response = await request(app).post("/api/hooks").send(hookData).expect(201);

                    expect(response.body.data.sizeUs).toBe(sizeUs);
                }
            });

            it("should create hook with different brands", async () => {
                const brands = ["Clover", "Tulip", "Knit Picks", "ChiaoGoo", "Prym"];

                for (const brand of brands) {
                    const hookData = {
                        sizeMm: 3.0 + brands.indexOf(brand),
                        brand: brand,
                    };

                    const response = await request(app).post("/api/hooks").send(hookData).expect(201);

                    expect(response.body.data.brand).toBe(brand);
                }
            });

            it("should create hook with price and currency", async () => {
                const hookData = {
                    sizeMm: 5.5,
                    price: 12.99,
                    currency: "GBP",
                };

                const response = await request(app).post("/api/hooks").send(hookData).expect(201);

                expect(response.body.data.price).toBe(12.99);
                expect(response.body.data.currency).toBe("GBP");
            });

            it("should automatically convert lowercase currency to uppercase", async () => {
                const hookData = {
                    sizeMm: 5.0,
                    currency: "usd",
                };

                const response = await request(app).post("/api/hooks").send(hookData).expect(201);

                expect(response.body.success).toBe(true);
                expect(response.body.data.currency).toBe("USD");

                const hookInDb = await Hook.findById(response.body.data._id);
                expect(hookInDb.currency).toBe("USD");
            });
        });

        describe("GET cases", () => {
            it("should return an empty array when no hooks exist", async () => {
                const response = await request(app).get("/api/hooks");

                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
                expect(response.body.data).toEqual([]);
                expect(response.body.pagination).toBeDefined();
                expect(response.body.pagination.total).toBe(0);
            });

            it("should return all hooks with default pagination", async () => {
                await Hook.create([
                    { sizeMm: 4.0, brand: "Clover" },
                    { sizeMm: 5.0, brand: "Tulip" },
                ]);

                const response = await request(app).get("/api/hooks");

                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
                expect(response.body.data).toHaveLength(2);
                expect(response.body.pagination).toBeDefined();
                expect(response.body.pagination.total).toBe(2);
                expect(response.body.pagination.page).toBe(1);
                expect(response.body.pagination.limit).toBe(20);
            });

            it("should filter hooks by material", async () => {
                await Hook.create([
                    { sizeMm: 4.0, material: "Aluminum" },
                    { sizeMm: 5.0, material: "Bamboo" },
                ]);

                const response = await request(app).get("/api/hooks?material=Aluminum");

                expect(response.status).toBe(200);
                expect(response.body.data).toHaveLength(1);
                expect(response.body.pagination.total).toBe(1);
                expect(response.body.data[0].material).toBe("Aluminum");
            });

            it("should filter hooks by brand", async () => {
                await Hook.create([
                    { sizeMm: 4.0, brand: "Clover" },
                    { sizeMm: 5.0, brand: "Tulip" },
                ]);

                const response = await request(app).get("/api/hooks?brand=Clover");

                expect(response.status).toBe(200);
                expect(response.body.data).toHaveLength(1);
                expect(response.body.pagination.total).toBe(1);
                expect(response.body.data[0].brand).toBe("Clover");
            });

            it("should filter hooks by sizeMm", async () => {
                await Hook.create([
                    { sizeMm: 4.0, brand: "Clover" },
                    { sizeMm: 5.0, brand: "Tulip" },
                    { sizeMm: 6.0, brand: "Prym" },
                ]);

                const response = await request(app).get("/api/hooks?sizeMm=5.0");

                expect(response.status).toBe(200);
                expect(response.body.data).toHaveLength(1);
                expect(response.body.pagination.total).toBe(1);
                expect(response.body.data[0].sizeMm).toBe(5.0);
            });

            it("should return a single hook by its ID", async () => {
                const hook = await Hook.create({ sizeMm: 5.5, brand: "Test Brand" });

                const response = await request(app).get(`/api/hooks/${hook._id}`);

                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
                expect(response.body.data._id).toBe(hook._id.toString());
                expect(response.body.data.sizeMm).toBe(5.5);
            });

            it("should return hooks sorted by sizeMm in ascending order", async () => {
                await Hook.create([
                    { sizeMm: 6.0 },
                    { sizeMm: 3.5 },
                    { sizeMm: 5.0 },
                ]);

                const response = await request(app).get("/api/hooks");

                expect(response.status).toBe(200);
                expect(response.body.data[0].sizeMm).toBe(3.5);
                expect(response.body.data[1].sizeMm).toBe(5.0);
                expect(response.body.data[2].sizeMm).toBe(6.0);
            });

            describe("Pagination", () => {
                beforeEach(async () => {
                    // Create 30 hooks for pagination testing
                    const hooks = [];
                    for (let i = 1; i <= 30; i++) {
                        hooks.push({
                            sizeMm: 2.0 + i * 0.5,
                            brand: i % 3 === 0 ? "Brand A" : i % 3 === 1 ? "Brand B" : "Brand C",
                            material: i % 2 === 0 ? "Aluminum" : "Bamboo",
                        });
                    }
                    await Hook.create(hooks);
                });

                it("should paginate hooks with default limit (20)", async () => {
                    const response = await request(app).get("/api/hooks?page=1");

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

                it("should return second page of hooks", async () => {
                    const response = await request(app).get("/api/hooks?page=2&limit=20");

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
                    const response = await request(app).get("/api/hooks?page=1&limit=15");

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
                    const response = await request(app).get("/api/hooks?page=2&limit=15");

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
                    const response = await request(app).get("/api/hooks?page=10&limit=20");

                    expect(response.status).toBe(200);
                    expect(response.body.data).toHaveLength(0);
                    expect(response.body.pagination.page).toBe(10);
                    expect(response.body.pagination.total).toBe(30);
                });

                it("should combine pagination with filters (brand)", async () => {
                    const response = await request(app).get("/api/hooks?brand=Brand A&page=1&limit=5");

                    expect(response.status).toBe(200);
                    expect(response.body.data).toHaveLength(5);
                    expect(response.body.pagination.total).toBe(10); // 10 Brand A hooks out of 30
                    expect(response.body.pagination.totalPages).toBe(2);
                    expect(response.body.data.every((h) => h.brand === "Brand A")).toBe(true);
                });

                it("should combine pagination with filters (material)", async () => {
                    const response = await request(app).get("/api/hooks?material=Aluminum&page=1&limit=10");

                    expect(response.status).toBe(200);
                    expect(response.body.data).toHaveLength(10);
                    expect(response.body.pagination.total).toBe(15); // 15 Aluminum hooks out of 30
                    expect(response.body.pagination.totalPages).toBe(2);
                    expect(response.body.data.every((h) => h.material === "Aluminum")).toBe(true);
                });

                it("should combine pagination with multiple filters", async () => {
                    const response = await request(app).get("/api/hooks?brand=Brand B&material=Bamboo&page=1&limit=5");

                    expect(response.status).toBe(200);
                    // Brand B (i % 3 === 1) and Bamboo (i % 2 === 1) = items 1, 7, 13, 19, 25
                    expect(response.body.pagination.total).toBe(5);
                    expect(response.body.data.every((h) => h.brand === "Brand B" && h.material === "Bamboo")).toBe(true);
                });

                it("should handle invalid page number (negative)", async () => {
                    const response = await request(app).get("/api/hooks?page=-1");

                    expect(response.status).toBe(200);
                    expect(response.body.pagination.page).toBe(1); // Should default to page 1
                });

                it("should handle invalid page number (zero)", async () => {
                    const response = await request(app).get("/api/hooks?page=0");

                    expect(response.status).toBe(200);
                    expect(response.body.pagination.page).toBe(1); // Should default to page 1
                });

                it("should cap limit at maximum (100)", async () => {
                    const response = await request(app).get("/api/hooks?limit=500");

                    expect(response.status).toBe(200);
                    expect(response.body.pagination.limit).toBe(100); // Should cap at 100
                });

                it("should handle non-numeric page parameter", async () => {
                    const response = await request(app).get("/api/hooks?page=abc");

                    expect(response.status).toBe(200);
                    expect(response.body.pagination.page).toBe(1); // Should default to page 1
                });

                it("should handle non-numeric limit parameter", async () => {
                    const response = await request(app).get("/api/hooks?limit=xyz");

                    expect(response.status).toBe(200);
                    expect(response.body.pagination.limit).toBe(20); // Should default to 20
                });

                it("should not interfere with hook filters (page and limit should be excluded from query)", async () => {
                    const response = await request(app).get("/api/hooks?page=1&limit=10&brand=Brand A");

                    expect(response.status).toBe(200);
                    // Should filter by brand, not treat page/limit as filter fields
                    expect(response.body.data.every((h) => h.brand === "Brand A")).toBe(true);
                });

                it("should handle pagination with very small limit", async () => {
                    const response = await request(app).get("/api/hooks?page=5&limit=3");

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
            it("should update a hook successfully", async () => {
                const hook = await Hook.create({ sizeMm: 5.0, brand: "Original Brand" });
                const updateData = { brand: "Updated Brand", material: "Steel" };

                const response = await request(app).put(`/api/hooks/${hook._id}`).send(updateData);

                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
                expect(response.body.data._id).toBe(hook._id.toString());
                expect(response.body.data.brand).toBe("Updated Brand");
                expect(response.body.data.material).toBe("Steel");
            });

            it("should update hook numeric fields", async () => {
                const hook = await Hook.create({ sizeMm: 5.0 });
                const updateData = { price: 15.99, currency: "USD" };

                const response = await request(app).put(`/api/hooks/${hook._id}`).send(updateData);

                expect(response.status).toBe(200);
                expect(response.body.data.price).toBe(15.99);
                expect(response.body.data.currency).toBe("USD");
            });

            it("should partially update hook fields", async () => {
                const hook = await Hook.create({
                    sizeMm: 5.0,
                    brand: "Original Brand",
                    material: "Aluminum",
                });
                const updateData = { material: "Bamboo" };

                const response = await request(app).put(`/api/hooks/${hook._id}`).send(updateData);

                expect(response.status).toBe(200);
                expect(response.body.data.sizeMm).toBe(5.0);
                expect(response.body.data.brand).toBe("Original Brand");
                expect(response.body.data.material).toBe("Bamboo");
            });

            it("should update hook notes", async () => {
                const hook = await Hook.create({ sizeMm: 4.0 });
                const updateData = { notes: "Updated notes for this hook" };

                const response = await request(app).put(`/api/hooks/${hook._id}`).send(updateData);

                expect(response.status).toBe(200);
                expect(response.body.data.notes).toBe("Updated notes for this hook");
            });
        });

        describe("DELETE cases", () => {
            it("should delete a hook successfully", async () => {
                const hook = await Hook.create({ sizeMm: 5.0, brand: "To Be Deleted" });

                const response = await request(app).delete(`/api/hooks/${hook._id}`);

                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
                expect(response.body.message).toBe("Hook deleted successfully");

                const dbHook = await Hook.findById(hook._id);
                expect(dbHook).toBeNull();
            });
        });
    });

    describe("Validation Failure Cases", () => {
        describe("POST cases", () => {
            it("should fail when sizeMm is missing", async () => {
                const hookData = {
                    brand: "Test Brand",
                };

                const response = await request(app).post("/api/hooks").send(hookData).expect(400);

                expect(response.body.success).toBe(false);
                expect(response.body.message).toBe("Validation error");
            });

            it("should fail when sizeMm is negative", async () => {
                const hookData = {
                    sizeMm: -5.0,
                };

                const response = await request(app).post("/api/hooks").send(hookData).expect(400);

                expect(response.body.success).toBe(false);
            });

            it("should fail when sizeMm is zero", async () => {
                const hookData = {
                    sizeMm: 0,
                };

                const response = await request(app).post("/api/hooks").send(hookData).expect(400);

                expect(response.body.success).toBe(false);
            });

            it("should fail when price is negative", async () => {
                const hookData = {
                    sizeMm: 5.0,
                    price: -10.99,
                };

                const response = await request(app).post("/api/hooks").send(hookData).expect(400);

                expect(response.body.success).toBe(false);
            });

            it("should fail when currency is not 3 characters", async () => {
                const hookData = {
                    sizeMm: 5.0,
                    currency: "US",
                };

                const response = await request(app).post("/api/hooks").send(hookData).expect(400);

                expect(response.body.success).toBe(false);
            });

            it("should fail when notes exceed 2000 characters", async () => {
                const hookData = {
                    sizeMm: 5.0,
                    notes: "a".repeat(2001),
                };

                const response = await request(app).post("/api/hooks").send(hookData).expect(400);

                expect(response.body.success).toBe(false);
            });

            it("should fail when sizeUs exceeds 50 characters", async () => {
                const hookData = {
                    sizeMm: 5.0,
                    sizeUs: "a".repeat(51),
                };

                const response = await request(app).post("/api/hooks").send(hookData).expect(400);

                expect(response.body.success).toBe(false);
            });

            it("should fail when material exceeds 100 characters", async () => {
                const hookData = {
                    sizeMm: 5.0,
                    material: "a".repeat(101),
                };

                const response = await request(app).post("/api/hooks").send(hookData).expect(400);

                expect(response.body.success).toBe(false);
            });

            it("should fail when brand exceeds 200 characters", async () => {
                const hookData = {
                    sizeMm: 5.0,
                    brand: "a".repeat(201),
                };

                const response = await request(app).post("/api/hooks").send(hookData).expect(400);

                expect(response.body.success).toBe(false);
            });
        });

        describe("GET cases", () => {
            it("should return 404 for a non-existent hook ID", async () => {
                const validNonExistentId = new mongoose.Types.ObjectId();
                const response = await request(app).get(`/api/hooks/${validNonExistentId}`);

                expect(response.status).toBe(404);
                expect(response.body.success).toBe(false);
                expect(response.body.message).toBe("Hook not found");
            });

            it("should return 400 for an invalid hook ID", async () => {
                const invalidId = "123-invalid-id";
                const response = await request(app).get(`/api/hooks/${invalidId}`);

                expect(response.status).toBe(400);
                expect(response.body.success).toBe(false);
                expect(response.body.message).toContain(`Invalid _id: ${invalidId}`);
            });
        });

        describe("PUT cases", () => {
            it("should return 400 when update body is empty", async () => {
                const hook = await Hook.create({ sizeMm: 5.0 });
                const updateData = {};

                const response = await request(app).put(`/api/hooks/${hook._id}`).send(updateData);

                expect(response.status).toBe(400);
                expect(response.body.success).toBe(false);
            });

            it("should return 400 for invalid update data (negative sizeMm)", async () => {
                const hook = await Hook.create({ sizeMm: 5.0 });
                const updateData = { sizeMm: -3.0 };

                const response = await request(app).put(`/api/hooks/${hook._id}`).send(updateData);

                expect(response.status).toBe(400);
                expect(response.body.success).toBe(false);
            });

            it("should return 404 when updating a non-existent hook", async () => {
                const validNonExistentId = new mongoose.Types.ObjectId();
                const updateData = { brand: "Updated Brand" };

                const response = await request(app).put(`/api/hooks/${validNonExistentId}`).send(updateData);

                expect(response.status).toBe(404);
                expect(response.body.success).toBe(false);
                expect(response.body.message).toBe("Hook not found");
            });

            it("should return 400 when brand exceeds max length in update", async () => {
                const hook = await Hook.create({ sizeMm: 5.0 });
                const updateData = { brand: "a".repeat(201) };

                const response = await request(app).put(`/api/hooks/${hook._id}`).send(updateData);

                expect(response.status).toBe(400);
                expect(response.body.success).toBe(false);
            });

            it("should return 400 when notes exceed max length in update", async () => {
                const hook = await Hook.create({ sizeMm: 5.0 });
                const updateData = { notes: "a".repeat(2001) };

                const response = await request(app).put(`/api/hooks/${hook._id}`).send(updateData);

                expect(response.status).toBe(400);
                expect(response.body.success).toBe(false);
            });
        });

        describe("DELETE cases", () => {
            it("should return 404 when deleting a non-existent hook", async () => {
                const validNonExistentId = new mongoose.Types.ObjectId();

                const response = await request(app).delete(`/api/hooks/${validNonExistentId}`);

                expect(response.status).toBe(404);
                expect(response.body.success).toBe(false);
                expect(response.body.message).toBe("Hook not found");
            });

            it("should return 400 when deleting with invalid ID", async () => {
                const invalidId = "invalid-id-format";

                const response = await request(app).delete(`/api/hooks/${invalidId}`);

                expect(response.status).toBe(400);
                expect(response.body.success).toBe(false);
            });
        });
    });

    describe("Database Persistence", () => {
        it("should persist timestamps correctly", async () => {
            const hookData = {
                sizeMm: 5.0,
            };

            const response = await request(app).post("/api/hooks").send(hookData).expect(201);

            expect(response.body.data).toHaveProperty("createdAt");
            expect(response.body.data).not.toHaveProperty("updatedAt"); // updatedAt is false in schema

            const createdAt = new Date(response.body.data.createdAt);
            expect(createdAt).toBeInstanceOf(Date);
        });

        it("should set default currency to EUR", async () => {
            const hookData = {
                sizeMm: 5.0,
            };

            const response = await request(app).post("/api/hooks").send(hookData).expect(201);

            expect(response.body.data.currency).toBe("EUR");
        });

        it("should not update updatedAt timestamp on update (as per schema config)", async () => {
            const hook = await Hook.create({ sizeMm: 5.0 });

            await new Promise((resolve) => setTimeout(resolve, 10));

            const response = await request(app)
                .put(`/api/hooks/${hook._id}`)
                .send({ brand: "Updated Brand" })
                .expect(200);

            expect(response.body.data).not.toHaveProperty("updatedAt");
        });
    });

    describe("Edge Cases", () => {
        it("should handle hook with zero price", async () => {
            const hookData = {
                sizeMm: 5.0,
                price: 0,
            };

            const response = await request(app).post("/api/hooks").send(hookData).expect(201);

            expect(response.body.data.price).toBe(0);
        });

        it("should handle hook with very long valid strings", async () => {
            const hookData = {
                sizeMm: 5.0,
                sizeUs: "a".repeat(50),
                material: "b".repeat(100),
                brand: "c".repeat(200),
                notes: "d".repeat(2000),
            };

            const response = await request(app).post("/api/hooks").send(hookData).expect(201);

            expect(response.body.data.sizeUs).toHaveLength(50);
            expect(response.body.data.material).toHaveLength(100);
            expect(response.body.data.brand).toHaveLength(200);
            expect(response.body.data.notes).toHaveLength(2000);
        });

        it("should handle empty notes field", async () => {
            const hookData = {
                sizeMm: 5.0,
                notes: "",
            };

            const response = await request(app).post("/api/hooks").send(hookData).expect(201);

            expect(response.body.data.notes).toBe("");
        });

        it("should handle special characters in text fields", async () => {
            const hookData = {
                sizeMm: 5.0,
                brand: "Brand <>&",
                notes: "Notes with 'quotes' and \"double quotes\"",
            };

            const response = await request(app).post("/api/hooks").send(hookData).expect(201);

            expect(response.body.data.brand).toContain("<>&");
            expect(response.body.data.notes).toContain("'quotes'");
        });

        it("should handle multiple query parameters at once", async () => {
            await Hook.create([
                { sizeMm: 4.0, brand: "Brand A", material: "Aluminum" },
                { sizeMm: 5.0, brand: "Brand A", material: "Bamboo" },
                { sizeMm: 6.0, brand: "Brand B", material: "Aluminum" },
            ]);

            const response = await request(app).get("/api/hooks?brand=Brand A&material=Aluminum");

            expect(response.status).toBe(200);
            expect(response.body.pagination.total).toBe(1);
            expect(response.body.data[0].sizeMm).toBe(4.0);
        });

        it("should handle very small sizeMm values", async () => {
            const hookData = {
                sizeMm: 0.5,
            };

            const response = await request(app).post("/api/hooks").send(hookData).expect(201);

            expect(response.body.data.sizeMm).toBe(0.5);
        });

        it("should handle very large sizeMm values", async () => {
            const hookData = {
                sizeMm: 25.0,
            };

            const response = await request(app).post("/api/hooks").send(hookData).expect(201);

            expect(response.body.data.sizeMm).toBe(25.0);
        });

        it("should handle decimal price values", async () => {
            const hookData = {
                sizeMm: 5.0,
                price: 12.99,
            };

            const response = await request(app).post("/api/hooks").send(hookData).expect(201);

            expect(response.body.data.price).toBe(12.99);
        });

        describe("Project Count", () => {
            it("should return projectCount of 0 when hook is not used in any projects", async () => {
                const hook = await Hook.create({ sizeMm: 5.0 });

                const response = await request(app).get(`/api/hooks/${hook._id}`).expect(200);

                expect(response.body.success).toBe(true);
                expect(response.body.data.projectCount).toBe(0);
            });

            it("should return correct projectCount when hook is used in projects", async () => {
                const hook = await Hook.create({ sizeMm: 6.0, sizeUs: "J/10", brand: "Clover" });

                // Create 3 projects using this hook
                await Project.create({
                    name: "Amigurumi Project",
                    projectType: "crochet",
                    hooksUsed: [{ hook: hook._id, isPrimary: true }],
                });
                await Project.create({
                    name: "Blanket Project",
                    projectType: "crochet",
                    hooksUsed: [{ hook: hook._id }],
                });
                await Project.create({
                    name: "Scarf Project",
                    projectType: "crochet",
                    hooksUsed: [{ hook: hook._id, notes: "Main hook" }],
                });

                const response = await request(app).get(`/api/hooks/${hook._id}`).expect(200);

                expect(response.body.success).toBe(true);
                expect(response.body.data.projectCount).toBe(3);
            });

            it("should include projectCount in list response", async () => {
                const hook1 = await Hook.create({ sizeMm: 4.0, sizeUs: "G/6" });
                const hook2 = await Hook.create({ sizeMm: 5.0, sizeUs: "H/8" });
                const hook3 = await Hook.create({ sizeMm: 6.0, sizeUs: "J/10" });

                await Project.create({
                    name: "Project A",
                    projectType: "crochet",
                    hooksUsed: [{ hook: hook1._id }],
                });
                await Project.create({
                    name: "Project B",
                    projectType: "crochet",
                    hooksUsed: [{ hook: hook2._id }],
                });
                await Project.create({
                    name: "Project C",
                    projectType: "crochet",
                    hooksUsed: [{ hook: hook2._id }],
                });

                const response = await request(app).get("/api/hooks").expect(200);

                expect(response.body.success).toBe(true);
                expect(response.body.data.length).toBeGreaterThanOrEqual(3);

                const hookWithCount1 = response.body.data.find((h) => h._id === hook1._id.toString());
                const hookWithCount2 = response.body.data.find((h) => h._id === hook2._id.toString());
                const hookWithCount0 = response.body.data.find((h) => h._id === hook3._id.toString());

                expect(hookWithCount1.projectCount).toBe(1);
                expect(hookWithCount2.projectCount).toBe(2);
                expect(hookWithCount0.projectCount).toBe(0);
            });

            it("should populate usedInProjects with project details", async () => {
                const hook = await Hook.create({ sizeMm: 7.0, sizeUs: "K/10.5" });

                await Project.create({
                    name: "Granny Square Blanket",
                    projectType: "crochet",
                    status: "completed",
                    hooksUsed: [{ hook: hook._id, isPrimary: true }],
                });

                const response = await request(app).get(`/api/hooks/${hook._id}`).expect(200);

                expect(response.body.success).toBe(true);
                expect(response.body.data.usedInProjects).toHaveLength(1);
                expect(response.body.data.usedInProjects[0].name).toBe("Granny Square Blanket");
                expect(response.body.data.usedInProjects[0].projectType).toBe("crochet");
                expect(response.body.data.usedInProjects[0].status).toBe("completed");
                expect(response.body.data.projectCount).toBe(1);
            });
        });
    });
});
