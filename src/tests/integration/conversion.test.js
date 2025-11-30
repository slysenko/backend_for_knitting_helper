import request from "supertest";
import mongoose from "mongoose";
import app from "../../app.js";
import Conversion from "../../models/conversion.js";
import Gauge from "../../models/gauge.js";
import Project from "../../models/project.js";

describe("Conversion Routes - Integration Tests", () => {
    let testProject;
    let testGauge;

    beforeEach(async () => {
        testProject = await Project.create({
            name: "Test Project",
            projectType: "knitting",
        });

        testGauge = await Gauge.create({
            project: testProject._id,
            name: "Test Gauge",
            gaugeType: "blocked",
            stitches: 20,
            rows: 28,
            widthCm: 10,
            heightCm: 10,
        });
    });

    describe("Success Cases", () => {
        describe("POST cases", () => {
            it("should create a conversion with all required fields", async () => {
                const conversionData = {
                    gauge: testGauge._id.toString(),
                    fromValue: 10,
                    fromUnit: "cm",
                    toValue: 28,
                    toUnit: "rows",
                };

                const response = await request(app).post("/api/conversions").send(conversionData).expect(201);

                expect(response.body.success).toBe(true);
                expect(response.body.message).toBe("Conversion created successfully");
                expect(response.body.data).toHaveProperty("_id");
                expect(response.body.data.fromValue).toBe(10);
                expect(response.body.data.fromUnit).toBe("cm");
                expect(response.body.data.toValue).toBe(28);
                expect(response.body.data.toUnit).toBe("rows");

                const conversionInDb = await Conversion.findById(response.body.data._id);
                expect(conversionInDb).not.toBeNull();
            });

            it("should create a conversion with all optional fields", async () => {
                const conversionData = {
                    gauge: testGauge._id.toString(),
                    name: "Stitches to Inches",
                    comments: "Useful for calculating sweater width",
                    fromValue: 50,
                    fromUnit: "stitches",
                    toValue: 10,
                    toUnit: "inches",
                };

                const response = await request(app).post("/api/conversions").send(conversionData).expect(201);

                expect(response.body.success).toBe(true);
                expect(response.body.data.name).toBe("Stitches to Inches");
                expect(response.body.data.comments).toBe("Useful for calculating sweater width");
                expect(response.body.data.fromValue).toBe(50);
                expect(response.body.data.fromUnit).toBe("stitches");
                expect(response.body.data.toValue).toBe(10);
                expect(response.body.data.toUnit).toBe("inches");
            });

            it("should trim whitespace from conversion name", async () => {
                const conversionData = {
                    gauge: testGauge._id.toString(),
                    name: "  Trimmed Conversion  ",
                    fromValue: 5,
                    fromUnit: "cm",
                    toValue: 10,
                    toUnit: "stitches",
                };

                const response = await request(app).post("/api/conversions").send(conversionData).expect(201);

                expect(response.body.data.name).toBe("Trimmed Conversion");
            });

            it("should create conversion with decimal numeric values", async () => {
                const conversionData = {
                    gauge: testGauge._id.toString(),
                    name: "Decimal Conversion",
                    fromValue: 7.5,
                    fromUnit: "inches",
                    toValue: 19.05,
                    toUnit: "cm",
                };

                const response = await request(app).post("/api/conversions").send(conversionData).expect(201);

                expect(response.body.data.fromValue).toBe(7.5);
                expect(response.body.data.toValue).toBe(19.05);
            });

            it("should create conversions with all valid unit combinations", async () => {
                const units = ["stitches", "rows", "cm", "inches"];

                for (const fromUnit of units) {
                    for (const toUnit of units) {
                        const conversionData = {
                            gauge: testGauge._id.toString(),
                            name: `${fromUnit} to ${toUnit}`,
                            fromValue: 10,
                            fromUnit: fromUnit,
                            toValue: 20,
                            toUnit: toUnit,
                        };

                        const response = await request(app).post("/api/conversions").send(conversionData).expect(201);

                        expect(response.body.data.fromUnit).toBe(fromUnit);
                        expect(response.body.data.toUnit).toBe(toUnit);
                    }
                }
            });

            it("should create bidirectional conversions", async () => {
                const conversion1 = {
                    gauge: testGauge._id.toString(),
                    name: "CM to Rows",
                    fromValue: 10,
                    fromUnit: "cm",
                    toValue: 28,
                    toUnit: "rows",
                };

                const conversion2 = {
                    gauge: testGauge._id.toString(),
                    name: "Rows to CM",
                    fromValue: 28,
                    fromUnit: "rows",
                    toValue: 10,
                    toUnit: "cm",
                };

                const response1 = await request(app).post("/api/conversions").send(conversion1).expect(201);
                const response2 = await request(app).post("/api/conversions").send(conversion2).expect(201);

                expect(response1.body.data.fromUnit).toBe("cm");
                expect(response1.body.data.toUnit).toBe("rows");
                expect(response2.body.data.fromUnit).toBe("rows");
                expect(response2.body.data.toUnit).toBe("cm");
            });
        });

        describe("GET cases", () => {
            it("should return an empty array when no conversions exist", async () => {
                const response = await request(app).get("/api/conversions");

                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
                expect(response.body.data).toEqual([]);
                expect(response.body.pagination).toBeDefined();
                expect(response.body.pagination.total).toBe(0);
            });

            it("should return all conversions with default pagination", async () => {
                await Conversion.create([
                    {
                        gauge: testGauge._id,
                        name: "Conversion 1",
                        fromValue: 10,
                        fromUnit: "cm",
                        toValue: 20,
                        toUnit: "stitches",
                    },
                    {
                        gauge: testGauge._id,
                        name: "Conversion 2",
                        fromValue: 5,
                        fromUnit: "inches",
                        toValue: 12.7,
                        toUnit: "cm",
                    },
                ]);

                const response = await request(app).get("/api/conversions");

                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
                expect(response.body.data).toHaveLength(2);
                expect(response.body.pagination).toBeDefined();
                expect(response.body.pagination.total).toBe(2);
                expect(response.body.pagination.page).toBe(1);
                expect(response.body.pagination.limit).toBe(20);
            });

            it("should filter conversions by gauge", async () => {
                const gauge2 = await Gauge.create({
                    project: testProject._id,
                    name: "Gauge 2",
                    gaugeType: "unblocked",
                    stitches: 22,
                    rows: 30,
                    widthCm: 10,
                    heightCm: 10,
                });

                await Conversion.create([
                    {
                        gauge: testGauge._id,
                        name: "Gauge 1 Conversion",
                        fromValue: 10,
                        fromUnit: "cm",
                        toValue: 28,
                        toUnit: "rows",
                    },
                    {
                        gauge: gauge2._id,
                        name: "Gauge 2 Conversion",
                        fromValue: 10,
                        fromUnit: "cm",
                        toValue: 30,
                        toUnit: "rows",
                    },
                ]);

                const response = await request(app).get(`/api/conversions?gauge=${testGauge._id}`);

                expect(response.status).toBe(200);
                expect(response.body.data).toHaveLength(1);
                expect(response.body.pagination.total).toBe(1);
                expect(response.body.data[0].name).toBe("Gauge 1 Conversion");
            });

            it("should return a single conversion by its ID", async () => {
                const conversion = await Conversion.create({
                    gauge: testGauge._id,
                    name: "Single Conversion",
                    fromValue: 10,
                    fromUnit: "cm",
                    toValue: 20,
                    toUnit: "stitches",
                });

                const response = await request(app).get(`/api/conversions/${conversion._id}`);

                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
                expect(response.body.data._id).toBe(conversion._id.toString());
                expect(response.body.data.name).toBe("Single Conversion");
            });

            it("should populate gauge in single conversion", async () => {
                const conversion = await Conversion.create({
                    gauge: testGauge._id,
                    name: "Populated Conversion",
                    fromValue: 10,
                    fromUnit: "cm",
                    toValue: 28,
                    toUnit: "rows",
                });

                const response = await request(app).get(`/api/conversions/${conversion._id}`);

                expect(response.status).toBe(200);
                expect(response.body.data.gauge.name).toBe("Test Gauge");
                expect(response.body.data.gauge.gaugeType).toBe("blocked");
                expect(response.body.data.gauge.stitches).toBe(20);
            });

            it("should return conversions sorted by createdAt in descending order", async () => {
                const conversion1 = await Conversion.create({
                    gauge: testGauge._id,
                    name: "Conversion 1",
                    fromValue: 10,
                    fromUnit: "cm",
                    toValue: 28,
                    toUnit: "rows",
                });
                await new Promise((resolve) => setTimeout(resolve, 10));
                const conversion2 = await Conversion.create({
                    gauge: testGauge._id,
                    name: "Conversion 2",
                    fromValue: 5,
                    fromUnit: "cm",
                    toValue: 14,
                    toUnit: "rows",
                });

                const response = await request(app).get("/api/conversions");

                expect(response.status).toBe(200);
                expect(response.body.data[0].name).toBe("Conversion 2");
                expect(response.body.data[1].name).toBe("Conversion 1");
            });

            it("should get all conversions for a specific gauge using gauge endpoint", async () => {
                await Conversion.create([
                    {
                        gauge: testGauge._id,
                        name: "Conversion 1",
                        fromValue: 10,
                        fromUnit: "cm",
                        toValue: 28,
                        toUnit: "rows",
                    },
                    {
                        gauge: testGauge._id,
                        name: "Conversion 2",
                        fromValue: 10,
                        fromUnit: "cm",
                        toValue: 20,
                        toUnit: "stitches",
                    },
                    {
                        gauge: testGauge._id,
                        name: "Conversion 3",
                        fromValue: 5,
                        fromUnit: "inches",
                        toValue: 50,
                        toUnit: "stitches",
                    },
                ]);

                const response = await request(app).get(`/api/conversions/gauge/${testGauge._id}`);

                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
                expect(response.body.data).toHaveLength(3);
                expect(response.body.data.every((c) => c.gauge.toString() === testGauge._id.toString())).toBe(true);
            });

            describe("Pagination", () => {
                beforeEach(async () => {
                    // Create 30 conversions for pagination testing
                    const conversions = [];
                    for (let i = 1; i <= 30; i++) {
                        conversions.push({
                            gauge: testGauge._id,
                            name: `Conversion ${i}`,
                            fromValue: i,
                            fromUnit: i % 2 === 0 ? "cm" : "inches",
                            toValue: i * 2,
                            toUnit: i % 2 === 0 ? "stitches" : "rows",
                        });
                    }
                    await Conversion.create(conversions);
                });

                it("should paginate conversions with default limit (20)", async () => {
                    const response = await request(app).get("/api/conversions?page=1");

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

                it("should return second page of conversions", async () => {
                    const response = await request(app).get("/api/conversions?page=2&limit=20");

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
                    const response = await request(app).get("/api/conversions?page=1&limit=15");

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
            });
        });

        describe("PUT cases", () => {
            it("should update a conversion successfully", async () => {
                const conversion = await Conversion.create({
                    gauge: testGauge._id,
                    name: "Original Name",
                    fromValue: 10,
                    fromUnit: "cm",
                    toValue: 28,
                    toUnit: "rows",
                });
                const updateData = { name: "Updated Name", toValue: 30 };

                const response = await request(app).put(`/api/conversions/${conversion._id}`).send(updateData);

                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
                expect(response.body.data._id).toBe(conversion._id.toString());
                expect(response.body.data.name).toBe("Updated Name");
                expect(response.body.data.toValue).toBe(30);
            });

            it("should update conversion numeric fields", async () => {
                const conversion = await Conversion.create({
                    gauge: testGauge._id,
                    name: "Test Conversion",
                    fromValue: 10,
                    fromUnit: "cm",
                    toValue: 28,
                    toUnit: "rows",
                });
                const updateData = { fromValue: 15, toValue: 42 };

                const response = await request(app).put(`/api/conversions/${conversion._id}`).send(updateData);

                expect(response.status).toBe(200);
                expect(response.body.data.fromValue).toBe(15);
                expect(response.body.data.toValue).toBe(42);
            });

            it("should update conversion units", async () => {
                const conversion = await Conversion.create({
                    gauge: testGauge._id,
                    name: "Test Conversion",
                    fromValue: 10,
                    fromUnit: "cm",
                    toValue: 28,
                    toUnit: "rows",
                });
                const updateData = { fromUnit: "inches", toUnit: "stitches" };

                const response = await request(app).put(`/api/conversions/${conversion._id}`).send(updateData);

                expect(response.status).toBe(200);
                expect(response.body.data.fromUnit).toBe("inches");
                expect(response.body.data.toUnit).toBe("stitches");
            });

            it("should partially update conversion fields", async () => {
                const conversion = await Conversion.create({
                    gauge: testGauge._id,
                    name: "Test Conversion",
                    comments: "Original comment",
                    fromValue: 10,
                    fromUnit: "cm",
                    toValue: 28,
                    toUnit: "rows",
                });
                const updateData = { comments: "Updated comment" };

                const response = await request(app).put(`/api/conversions/${conversion._id}`).send(updateData);

                expect(response.status).toBe(200);
                expect(response.body.data.name).toBe("Test Conversion");
                expect(response.body.data.comments).toBe("Updated comment");
            });
        });

        describe("DELETE cases", () => {
            it("should delete a conversion successfully", async () => {
                const conversion = await Conversion.create({
                    gauge: testGauge._id,
                    name: "To Be Deleted",
                    fromValue: 10,
                    fromUnit: "cm",
                    toValue: 28,
                    toUnit: "rows",
                });

                const response = await request(app).delete(`/api/conversions/${conversion._id}`);

                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
                expect(response.body.message).toBe("Conversion deleted successfully");

                const dbConversion = await Conversion.findById(conversion._id);
                expect(dbConversion).toBeNull();
            });
        });
    });

    describe("Validation Failure Cases", () => {
        describe("POST cases", () => {
            it("should fail when gauge is missing", async () => {
                const conversionData = {
                    name: "Test Conversion",
                    fromValue: 10,
                    fromUnit: "cm",
                    toValue: 28,
                    toUnit: "rows",
                };

                const response = await request(app).post("/api/conversions").send(conversionData).expect(400);

                expect(response.body.success).toBe(false);
                expect(response.body.message).toBe("Validation error");
            });

            it("should fail when fromValue is missing", async () => {
                const conversionData = {
                    gauge: testGauge._id.toString(),
                    name: "Test Conversion",
                    fromUnit: "cm",
                    toValue: 28,
                    toUnit: "rows",
                };

                const response = await request(app).post("/api/conversions").send(conversionData).expect(400);

                expect(response.body.success).toBe(false);
            });

            it("should fail when fromUnit is missing", async () => {
                const conversionData = {
                    gauge: testGauge._id.toString(),
                    name: "Test Conversion",
                    fromValue: 10,
                    toValue: 28,
                    toUnit: "rows",
                };

                const response = await request(app).post("/api/conversions").send(conversionData).expect(400);

                expect(response.body.success).toBe(false);
            });

            it("should fail when toValue is missing", async () => {
                const conversionData = {
                    gauge: testGauge._id.toString(),
                    name: "Test Conversion",
                    fromValue: 10,
                    fromUnit: "cm",
                    toUnit: "rows",
                };

                const response = await request(app).post("/api/conversions").send(conversionData).expect(400);

                expect(response.body.success).toBe(false);
            });

            it("should fail when toUnit is missing", async () => {
                const conversionData = {
                    gauge: testGauge._id.toString(),
                    name: "Test Conversion",
                    fromValue: 10,
                    fromUnit: "cm",
                    toValue: 28,
                };

                const response = await request(app).post("/api/conversions").send(conversionData).expect(400);

                expect(response.body.success).toBe(false);
            });

            it("should fail when name is empty string", async () => {
                const conversionData = {
                    gauge: testGauge._id.toString(),
                    name: "",
                    fromValue: 10,
                    fromUnit: "cm",
                    toValue: 28,
                    toUnit: "rows",
                };

                const response = await request(app).post("/api/conversions").send(conversionData).expect(400);

                expect(response.body.success).toBe(false);
            });

            it("should fail when name exceeds 200 characters", async () => {
                const conversionData = {
                    gauge: testGauge._id.toString(),
                    name: "a".repeat(201),
                    fromValue: 10,
                    fromUnit: "cm",
                    toValue: 28,
                    toUnit: "rows",
                };

                const response = await request(app).post("/api/conversions").send(conversionData).expect(400);

                expect(response.body.success).toBe(false);
            });

            it("should fail when comments exceed 1000 characters", async () => {
                const conversionData = {
                    gauge: testGauge._id.toString(),
                    name: "Test Conversion",
                    comments: "a".repeat(1001),
                    fromValue: 10,
                    fromUnit: "cm",
                    toValue: 28,
                    toUnit: "rows",
                };

                const response = await request(app).post("/api/conversions").send(conversionData).expect(400);

                expect(response.body.success).toBe(false);
            });

            it("should fail when fromValue is negative", async () => {
                const conversionData = {
                    gauge: testGauge._id.toString(),
                    name: "Test Conversion",
                    fromValue: -10,
                    fromUnit: "cm",
                    toValue: 28,
                    toUnit: "rows",
                };

                const response = await request(app).post("/api/conversions").send(conversionData).expect(400);

                expect(response.body.success).toBe(false);
            });

            it("should fail when toValue is negative", async () => {
                const conversionData = {
                    gauge: testGauge._id.toString(),
                    name: "Test Conversion",
                    fromValue: 10,
                    fromUnit: "cm",
                    toValue: -28,
                    toUnit: "rows",
                };

                const response = await request(app).post("/api/conversions").send(conversionData).expect(400);

                expect(response.body.success).toBe(false);
            });

            it("should fail when fromUnit is invalid", async () => {
                const conversionData = {
                    gauge: testGauge._id.toString(),
                    name: "Test Conversion",
                    fromValue: 10,
                    fromUnit: "invalid",
                    toValue: 28,
                    toUnit: "rows",
                };

                const response = await request(app).post("/api/conversions").send(conversionData).expect(400);

                expect(response.body.success).toBe(false);
            });

            it("should fail when toUnit is invalid", async () => {
                const conversionData = {
                    gauge: testGauge._id.toString(),
                    name: "Test Conversion",
                    fromValue: 10,
                    fromUnit: "cm",
                    toValue: 28,
                    toUnit: "invalid",
                };

                const response = await request(app).post("/api/conversions").send(conversionData).expect(400);

                expect(response.body.success).toBe(false);
            });

            it("should fail when gauge ID is invalid", async () => {
                const conversionData = {
                    gauge: "invalid-id",
                    name: "Test Conversion",
                    fromValue: 10,
                    fromUnit: "cm",
                    toValue: 28,
                    toUnit: "rows",
                };

                const response = await request(app).post("/api/conversions").send(conversionData).expect(400);

                expect(response.body.success).toBe(false);
            });

            it("should fail when gauge does not exist", async () => {
                const validNonExistentId = new mongoose.Types.ObjectId();
                const conversionData = {
                    gauge: validNonExistentId.toString(),
                    name: "Test Conversion",
                    fromValue: 10,
                    fromUnit: "cm",
                    toValue: 28,
                    toUnit: "rows",
                };

                const response = await request(app).post("/api/conversions").send(conversionData).expect(404);

                expect(response.body.success).toBe(false);
                expect(response.body.message).toBe("Gauge not found");
            });
        });

        describe("GET cases", () => {
            it("should return 404 for a non-existent conversion ID", async () => {
                const validNonExistentId = new mongoose.Types.ObjectId();
                const response = await request(app).get(`/api/conversions/${validNonExistentId}`);

                expect(response.status).toBe(404);
                expect(response.body.success).toBe(false);
                expect(response.body.message).toBe("Conversion not found");
            });

            it("should return 400 for an invalid conversion ID", async () => {
                const invalidId = "123-invalid-id";
                const response = await request(app).get(`/api/conversions/${invalidId}`);

                expect(response.status).toBe(400);
                expect(response.body.success).toBe(false);
                expect(response.body.message).toContain(`Invalid _id: ${invalidId}`);
            });

            it("should return 404 when getting conversions for non-existent gauge", async () => {
                const validNonExistentId = new mongoose.Types.ObjectId();
                const response = await request(app).get(`/api/conversions/gauge/${validNonExistentId}`);

                expect(response.status).toBe(404);
                expect(response.body.success).toBe(false);
                expect(response.body.message).toBe("Gauge not found");
            });

            it("should return 400 for an invalid gauge ID in query", async () => {
                const response = await request(app).get("/api/conversions?gauge=invalid-id");

                expect(response.status).toBe(400);
                expect(response.body.success).toBe(false);
            });
        });

        describe("PUT cases", () => {
            it("should return 400 when update body is empty", async () => {
                const conversion = await Conversion.create({
                    gauge: testGauge._id,
                    name: "Test Conversion",
                    fromValue: 10,
                    fromUnit: "cm",
                    toValue: 28,
                    toUnit: "rows",
                });
                const updateData = {};

                const response = await request(app).put(`/api/conversions/${conversion._id}`).send(updateData);

                expect(response.status).toBe(400);
                expect(response.body.success).toBe(false);
            });

            it("should return 404 when updating a non-existent conversion", async () => {
                const validNonExistentId = new mongoose.Types.ObjectId();
                const updateData = { name: "Updated Name" };

                const response = await request(app).put(`/api/conversions/${validNonExistentId}`).send(updateData);

                expect(response.status).toBe(404);
                expect(response.body.success).toBe(false);
                expect(response.body.message).toBe("Conversion not found");
            });

            it("should return 400 when name exceeds max length in update", async () => {
                const conversion = await Conversion.create({
                    gauge: testGauge._id,
                    name: "Test Conversion",
                    fromValue: 10,
                    fromUnit: "cm",
                    toValue: 28,
                    toUnit: "rows",
                });
                const updateData = { name: "a".repeat(201) };

                const response = await request(app).put(`/api/conversions/${conversion._id}`).send(updateData);

                expect(response.status).toBe(400);
                expect(response.body.success).toBe(false);
            });

            it("should return 400 when updating with invalid unit", async () => {
                const conversion = await Conversion.create({
                    gauge: testGauge._id,
                    name: "Test Conversion",
                    fromValue: 10,
                    fromUnit: "cm",
                    toValue: 28,
                    toUnit: "rows",
                });
                const updateData = { fromUnit: "invalid" };

                const response = await request(app).put(`/api/conversions/${conversion._id}`).send(updateData);

                expect(response.status).toBe(400);
                expect(response.body.success).toBe(false);
            });
        });

        describe("DELETE cases", () => {
            it("should return 404 when deleting a non-existent conversion", async () => {
                const validNonExistentId = new mongoose.Types.ObjectId();

                const response = await request(app).delete(`/api/conversions/${validNonExistentId}`);

                expect(response.status).toBe(404);
                expect(response.body.success).toBe(false);
                expect(response.body.message).toBe("Conversion not found");
            });

            it("should return 400 when deleting with invalid ID", async () => {
                const invalidId = "invalid-id-format";

                const response = await request(app).delete(`/api/conversions/${invalidId}`);

                expect(response.status).toBe(400);
                expect(response.body.success).toBe(false);
            });
        });
    });

    describe("Database Persistence", () => {
        it("should persist timestamps correctly", async () => {
            const conversionData = {
                gauge: testGauge._id.toString(),
                name: "Timestamp Test",
                fromValue: 10,
                fromUnit: "cm",
                toValue: 28,
                toUnit: "rows",
            };

            const response = await request(app).post("/api/conversions").send(conversionData).expect(201);

            expect(response.body.data).toHaveProperty("createdAt");
            expect(response.body.data).not.toHaveProperty("updatedAt");

            const createdAt = new Date(response.body.data.createdAt);
            expect(createdAt).toBeInstanceOf(Date);
        });
    });

    describe("Edge Cases", () => {
        it("should handle conversion with zero numeric values", async () => {
            const conversionData = {
                gauge: testGauge._id.toString(),
                name: "Zero Values Conversion",
                fromValue: 0,
                fromUnit: "cm",
                toValue: 0,
                toUnit: "rows",
            };

            const response = await request(app).post("/api/conversions").send(conversionData).expect(201);

            expect(response.body.data.fromValue).toBe(0);
            expect(response.body.data.toValue).toBe(0);
        });

        it("should handle conversion with very long valid name", async () => {
            const conversionData = {
                gauge: testGauge._id.toString(),
                name: "a".repeat(200),
                fromValue: 10,
                fromUnit: "cm",
                toValue: 28,
                toUnit: "rows",
            };

            const response = await request(app).post("/api/conversions").send(conversionData).expect(201);

            expect(response.body.data.name).toHaveLength(200);
        });

        it("should handle conversion without name field", async () => {
            const conversionData = {
                gauge: testGauge._id.toString(),
                fromValue: 10,
                fromUnit: "cm",
                toValue: 28,
                toUnit: "rows",
            };

            const response = await request(app).post("/api/conversions").send(conversionData).expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.data.fromValue).toBe(10);
            expect(response.body.data.toValue).toBe(28);
        });

        it("should handle empty comments field", async () => {
            const conversionData = {
                gauge: testGauge._id.toString(),
                name: "Conversion with Empty Comments",
                comments: "",
                fromValue: 10,
                fromUnit: "cm",
                toValue: 28,
                toUnit: "rows",
            };

            const response = await request(app).post("/api/conversions").send(conversionData).expect(201);

            expect(response.body.data.comments).toBe("");
        });

        it("should handle special characters in text fields", async () => {
            const conversionData = {
                gauge: testGauge._id.toString(),
                name: "Conversion with Special Chars: !@#$%^&*()",
                comments: "Comments with 'quotes' and \"double quotes\"",
                fromValue: 10,
                fromUnit: "cm",
                toValue: 28,
                toUnit: "rows",
            };

            const response = await request(app).post("/api/conversions").send(conversionData).expect(201);

            expect(response.body.data.name).toContain("!@#$%^&*()");
            expect(response.body.data.comments).toContain("'quotes'");
        });

        it("should handle multiple conversions for the same gauge", async () => {
            const conversions = [
                {
                    gauge: testGauge._id.toString(),
                    name: "CM to Rows",
                    fromValue: 10,
                    fromUnit: "cm",
                    toValue: 28,
                    toUnit: "rows",
                },
                {
                    gauge: testGauge._id.toString(),
                    name: "CM to Stitches",
                    fromValue: 10,
                    fromUnit: "cm",
                    toValue: 20,
                    toUnit: "stitches",
                },
                {
                    gauge: testGauge._id.toString(),
                    name: "Inches to Rows",
                    fromValue: 5,
                    fromUnit: "inches",
                    toValue: 70,
                    toUnit: "rows",
                },
            ];

            for (const conversionData of conversions) {
                await request(app).post("/api/conversions").send(conversionData).expect(201);
            }

            const response = await request(app).get(`/api/conversions/gauge/${testGauge._id}`);

            expect(response.status).toBe(200);
            expect(response.body.data).toHaveLength(3);
        });

        it("should handle very large numeric values", async () => {
            const conversionData = {
                gauge: testGauge._id.toString(),
                name: "Large Values",
                fromValue: 999999.99,
                fromUnit: "cm",
                toValue: 1234567.89,
                toUnit: "rows",
            };

            const response = await request(app).post("/api/conversions").send(conversionData).expect(201);

            expect(response.body.data.fromValue).toBe(999999.99);
            expect(response.body.data.toValue).toBe(1234567.89);
        });

        it("should handle same unit conversion", async () => {
            const conversionData = {
                gauge: testGauge._id.toString(),
                name: "Same Unit Conversion",
                fromValue: 10,
                fromUnit: "cm",
                toValue: 10,
                toUnit: "cm",
            };

            const response = await request(app).post("/api/conversions").send(conversionData).expect(201);

            expect(response.body.data.fromUnit).toBe("cm");
            expect(response.body.data.toUnit).toBe("cm");
        });
    });
});
