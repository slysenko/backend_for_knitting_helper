import request from "supertest";
import mongoose from "mongoose";
import app from "../../app.js";
import Gauge from "../../models/gauge.js";
import Project from "../../models/project.js";
import Yarn from "../../models/yarn.js";
import Needle from "../../models/needle.js";
import Hook from "../../models/hook.js";

describe("Gauge Routes - Integration Tests", () => {
    let testProject;
    let testYarn;
    let testNeedle;
    let testHook;

    beforeEach(async () => {
        testProject = await Project.create({
            name: "Test Project",
            projectType: "knitting",
        });

        testYarn = await Yarn.create({
            name: "Test Yarn",
        });

        testNeedle = await Needle.create({
            sizeMm: 3.5,
            sizeUs: "US 4",
            type: "circular",
            lengthCm: 80,
            material: "Bamboo",
            brand: "ChiaoGoo",
            price: 12.99,
            currency: "USD",
            notes: "Perfect for sweaters",
        });

        testHook = await Hook.create({
            sizeMm: 6.0,
            sizeUs: "J/10",
            material: "Aluminum",
            brand: "Clover",
            price: 8.99,
            currency: "USD",
            notes: "Ergonomic handle, very comfortable to use",
        });
    });

    describe("Success Cases", () => {
        describe("POST cases", () => {
            it("should create a gauge with minimal required fields", async () => {
                const gaugeData = {
                    project: testProject._id.toString(),
                    name: "Test Gauge",
                    gaugeType: "blocked",
                    stitches: 20,
                    rows: 28,
                    widthCm: 10,
                    heightCm: 10,
                };

                const response = await request(app).post("/api/gauges").send(gaugeData).expect(201);

                expect(response.body.success).toBe(true);
                expect(response.body.message).toBe("Gauge created successfully");
                expect(response.body.data).toHaveProperty("_id");
                expect(response.body.data.name).toBe("Test Gauge");
                expect(response.body.data.gaugeType).toBe("blocked");
                expect(response.body.data.stitches).toBe(20);
                expect(response.body.data.rows).toBe(28);
                expect(response.body.data.widthCm).toBe(10);
                expect(response.body.data.heightCm).toBe(10);

                const gaugeInDb = await Gauge.findById(response.body.data._id);
                expect(gaugeInDb).not.toBeNull();
                expect(gaugeInDb.name).toBe("Test Gauge");
            });

            it("should create a gauge with all optional fields", async () => {
                const gaugeData = {
                    project: testProject._id.toString(),
                    name: "Complete Gauge",
                    gaugeType: "unblocked",
                    comments: "Test comments",
                    yarn: testYarn._id.toString(),
                    needle: testNeedle._id.toString(),
                    stitches: 24,
                    rows: 32,
                    widthCm: 10,
                    heightCm: 10,
                };

                const response = await request(app).post("/api/gauges").send(gaugeData).expect(201);

                expect(response.body.success).toBe(true);
                expect(response.body.data.name).toBe("Complete Gauge");
                expect(response.body.data.gaugeType).toBe("unblocked");
                expect(response.body.data.comments).toBe("Test comments");
                expect(response.body.data.yarn).toBe(testYarn._id.toString());
                expect(response.body.data.needle).toBe(testNeedle._id.toString());
                expect(response.body.data.stitches).toBe(24);
                expect(response.body.data.rows).toBe(32);
            });

            it("should create a gauge with hook instead of needle", async () => {
                const gaugeData = {
                    project: testProject._id.toString(),
                    name: "Crochet Gauge",
                    gaugeType: "blocked",
                    hook: testHook._id.toString(),
                    stitches: 18,
                    rows: 20,
                    widthCm: 10,
                    heightCm: 10,
                };

                const response = await request(app).post("/api/gauges").send(gaugeData).expect(201);

                expect(response.body.success).toBe(true);
                expect(response.body.data.hook).toBe(testHook._id.toString());
                expect(response.body.data.needle).toBeUndefined();
            });

            it("should trim whitespace from gauge name", async () => {
                const gaugeData = {
                    project: testProject._id.toString(),
                    name: "  Trimmed Gauge  ",
                    gaugeType: "blocked",
                    stitches: 20,
                    rows: 28,
                    widthCm: 10,
                    heightCm: 10,
                };

                const response = await request(app).post("/api/gauges").send(gaugeData).expect(201);

                expect(response.body.data.name).toBe("Trimmed Gauge");
            });

            it("should create gauge with decimal numeric values", async () => {
                const gaugeData = {
                    project: testProject._id.toString(),
                    name: "Decimal Gauge",
                    gaugeType: "blocked",
                    stitches: 22.5,
                    rows: 30.5,
                    widthCm: 10.5,
                    heightCm: 10.5,
                };

                const response = await request(app).post("/api/gauges").send(gaugeData).expect(201);

                expect(response.body.data.stitches).toBe(22.5);
                expect(response.body.data.rows).toBe(30.5);
                expect(response.body.data.widthCm).toBe(10.5);
                expect(response.body.data.heightCm).toBe(10.5);
            });

            it("should create gauge with both gaugeType values", async () => {
                const blockedGauge = await request(app)
                    .post("/api/gauges")
                    .send({
                        project: testProject._id.toString(),
                        name: "Blocked Gauge",
                        gaugeType: "blocked",
                        stitches: 20,
                        rows: 28,
                        widthCm: 10,
                        heightCm: 10,
                    })
                    .expect(201);

                const unblockedGauge = await request(app)
                    .post("/api/gauges")
                    .send({
                        project: testProject._id.toString(),
                        name: "Unblocked Gauge",
                        gaugeType: "unblocked",
                        stitches: 22,
                        rows: 30,
                        widthCm: 10,
                        heightCm: 10,
                    })
                    .expect(201);

                expect(blockedGauge.body.data.gaugeType).toBe("blocked");
                expect(unblockedGauge.body.data.gaugeType).toBe("unblocked");
            });
        });

        describe("GET cases", () => {
            it("should return an empty array when no gauges exist", async () => {
                const response = await request(app).get("/api/gauges");

                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
                expect(response.body.data).toEqual([]);
                expect(response.body.pagination).toBeDefined();
                expect(response.body.pagination.total).toBe(0);
            });

            it("should return all gauges with default pagination", async () => {
                await Gauge.create([
                    {
                        project: testProject._id,
                        name: "Gauge 1",
                        gaugeType: "blocked",
                        stitches: 20,
                        rows: 28,
                        widthCm: 10,
                        heightCm: 10,
                    },
                    {
                        project: testProject._id,
                        name: "Gauge 2",
                        gaugeType: "unblocked",
                        stitches: 22,
                        rows: 30,
                        widthCm: 10,
                        heightCm: 10,
                    },
                ]);

                const response = await request(app).get("/api/gauges");

                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
                expect(response.body.data).toHaveLength(2);
                expect(response.body.pagination).toBeDefined();
                expect(response.body.pagination.total).toBe(2);
                expect(response.body.pagination.page).toBe(1);
                expect(response.body.pagination.limit).toBe(20);
            });

            it("should filter gauges by project", async () => {
                const project2 = await Project.create({ name: "Project 2", projectType: "crochet" });

                await Gauge.create([
                    {
                        project: testProject._id,
                        name: "Project 1 Gauge",
                        gaugeType: "blocked",
                        stitches: 20,
                        rows: 28,
                        widthCm: 10,
                        heightCm: 10,
                    },
                    {
                        project: project2._id,
                        name: "Project 2 Gauge",
                        gaugeType: "blocked",
                        stitches: 22,
                        rows: 30,
                        widthCm: 10,
                        heightCm: 10,
                    },
                ]);

                const response = await request(app).get(`/api/gauges?project=${testProject._id}`);

                expect(response.status).toBe(200);
                expect(response.body.data).toHaveLength(1);
                expect(response.body.pagination.total).toBe(1);
                expect(response.body.data[0].name).toBe("Project 1 Gauge");
            });

            it("should filter gauges by gaugeType", async () => {
                await Gauge.create([
                    {
                        project: testProject._id,
                        name: "Blocked Gauge",
                        gaugeType: "blocked",
                        stitches: 20,
                        rows: 28,
                        widthCm: 10,
                        heightCm: 10,
                    },
                    {
                        project: testProject._id,
                        name: "Unblocked Gauge",
                        gaugeType: "unblocked",
                        stitches: 22,
                        rows: 30,
                        widthCm: 10,
                        heightCm: 10,
                    },
                ]);

                const response = await request(app).get("/api/gauges?gaugeType=unblocked");

                expect(response.status).toBe(200);
                expect(response.body.data).toHaveLength(1);
                expect(response.body.pagination.total).toBe(1);
                expect(response.body.data[0].name).toBe("Unblocked Gauge");
            });

            it("should return a single gauge by its ID", async () => {
                const gauge = await Gauge.create({
                    project: testProject._id,
                    name: "Single Gauge",
                    gaugeType: "blocked",
                    stitches: 20,
                    rows: 28,
                    widthCm: 10,
                    heightCm: 10,
                });

                const response = await request(app).get(`/api/gauges/${gauge._id}`);

                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
                expect(response.body.data._id).toBe(gauge._id.toString());
                expect(response.body.data.name).toBe("Single Gauge");
            });

            it("should populate project, yarn, needle, and hook in single gauge", async () => {
                const gauge = await Gauge.create({
                    project: testProject._id,
                    name: "Populated Gauge",
                    gaugeType: "blocked",
                    yarn: testYarn._id,
                    needle: testNeedle._id,
                    stitches: 20,
                    rows: 28,
                    widthCm: 10,
                    heightCm: 10,
                });

                const response = await request(app).get(`/api/gauges/${gauge._id}`);

                expect(response.status).toBe(200);
                expect(response.body.data.project.name).toBe("Test Project");
                expect(response.body.data.yarn.name).toBe("Test Yarn");
                console.log("response.body.data", response.body.data);
                expect(response.body.data.needle.sizeMm).toBe(3.5);
            });

            it("should return gauges sorted by createdAt in descending order", async () => {
                const gauge1 = await Gauge.create({
                    project: testProject._id,
                    name: "Gauge 1",
                    gaugeType: "blocked",
                    stitches: 20,
                    rows: 28,
                    widthCm: 10,
                    heightCm: 10,
                });
                await new Promise((resolve) => setTimeout(resolve, 10));
                const gauge2 = await Gauge.create({
                    project: testProject._id,
                    name: "Gauge 2",
                    gaugeType: "blocked",
                    stitches: 20,
                    rows: 28,
                    widthCm: 10,
                    heightCm: 10,
                });

                const response = await request(app).get("/api/gauges");

                expect(response.status).toBe(200);
                expect(response.body.data[0].name).toBe("Gauge 2");
                expect(response.body.data[1].name).toBe("Gauge 1");
            });

            describe("Pagination", () => {
                beforeEach(async () => {
                    // Create 30 gauges for pagination testing
                    const gauges = [];
                    for (let i = 1; i <= 30; i++) {
                        gauges.push({
                            project: testProject._id,
                            name: `Gauge ${i}`,
                            gaugeType: i % 2 === 0 ? "blocked" : "unblocked",
                            stitches: 20,
                            rows: 28,
                            widthCm: 10,
                            heightCm: 10,
                        });
                    }
                    await Gauge.create(gauges);
                });

                it("should paginate gauges with default limit (20)", async () => {
                    const response = await request(app).get("/api/gauges?page=1");

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

                it("should return second page of gauges", async () => {
                    const response = await request(app).get("/api/gauges?page=2&limit=20");

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

                it("should combine pagination with filters (gaugeType)", async () => {
                    const response = await request(app).get("/api/gauges?gaugeType=blocked&page=1&limit=10");

                    expect(response.status).toBe(200);
                    expect(response.body.data).toHaveLength(10);
                    expect(response.body.pagination.total).toBe(15); // 15 blocked gauges out of 30
                    expect(response.body.pagination.totalPages).toBe(2);
                    expect(response.body.data.every((g) => g.gaugeType === "blocked")).toBe(true);
                });
            });
        });

        describe("PUT cases", () => {
            it("should update a gauge successfully", async () => {
                const gauge = await Gauge.create({
                    project: testProject._id,
                    name: "Original Name",
                    gaugeType: "blocked",
                    stitches: 20,
                    rows: 28,
                    widthCm: 10,
                    heightCm: 10,
                });
                const updateData = { name: "Updated Name", stitches: 24 };

                const response = await request(app).put(`/api/gauges/${gauge._id}`).send(updateData);

                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
                expect(response.body.data._id).toBe(gauge._id.toString());
                expect(response.body.data.name).toBe("Updated Name");
                expect(response.body.data.stitches).toBe(24);
            });

            it("should update gauge numeric fields", async () => {
                const gauge = await Gauge.create({
                    project: testProject._id,
                    name: "Test Gauge",
                    gaugeType: "blocked",
                    stitches: 20,
                    rows: 28,
                    widthCm: 10,
                    heightCm: 10,
                });
                const updateData = { stitches: 25, rows: 32, widthCm: 12, heightCm: 12 };

                const response = await request(app).put(`/api/gauges/${gauge._id}`).send(updateData);

                expect(response.status).toBe(200);
                expect(response.body.data.stitches).toBe(25);
                expect(response.body.data.rows).toBe(32);
                expect(response.body.data.widthCm).toBe(12);
                expect(response.body.data.heightCm).toBe(12);
            });

            it("should partially update gauge fields", async () => {
                const gauge = await Gauge.create({
                    project: testProject._id,
                    name: "Test Gauge",
                    gaugeType: "blocked",
                    comments: "Original comment",
                    stitches: 20,
                    rows: 28,
                    widthCm: 10,
                    heightCm: 10,
                });
                const updateData = { comments: "Updated comment" };

                const response = await request(app).put(`/api/gauges/${gauge._id}`).send(updateData);

                expect(response.status).toBe(200);
                expect(response.body.data.name).toBe("Test Gauge");
                expect(response.body.data.comments).toBe("Updated comment");
            });
        });

        describe("DELETE cases", () => {
            it("should delete a gauge successfully", async () => {
                const gauge = await Gauge.create({
                    project: testProject._id,
                    name: "To Be Deleted",
                    gaugeType: "blocked",
                    stitches: 20,
                    rows: 28,
                    widthCm: 10,
                    heightCm: 10,
                });

                const response = await request(app).delete(`/api/gauges/${gauge._id}`);

                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
                expect(response.body.message).toBe("Gauge deleted successfully");

                const dbGauge = await Gauge.findById(gauge._id);
                expect(dbGauge).toBeNull();
            });
        });

        describe("POST /:id/photos cases", () => {
            it("should add a photo to a gauge", async () => {
                const gauge = await Gauge.create({
                    project: testProject._id,
                    name: "Gauge with Photo",
                    gaugeType: "blocked",
                    stitches: 20,
                    rows: 28,
                    widthCm: 10,
                    heightCm: 10,
                });
                const photoData = {
                    filePath: "/uploads/gauge-photo.jpg",
                    caption: "Beautiful gauge swatch",
                };

                const response = await request(app).post(`/api/gauges/${gauge._id}/photos`).send(photoData).expect(201);

                expect(response.body.success).toBe(true);
                expect(response.body.message).toBe("Photo added successfully");
                expect(response.body.data.photos).toHaveLength(1);
                expect(response.body.data.photos[0].filePath).toBe("/uploads/gauge-photo.jpg");
                expect(response.body.data.photos[0].caption).toBe("Beautiful gauge swatch");
            });

            it("should add multiple photos to a gauge", async () => {
                const gauge = await Gauge.create({
                    project: testProject._id,
                    name: "Gauge with Multiple Photos",
                    gaugeType: "blocked",
                    stitches: 20,
                    rows: 28,
                    widthCm: 10,
                    heightCm: 10,
                });

                await request(app)
                    .post(`/api/gauges/${gauge._id}/photos`)
                    .send({ filePath: "/uploads/photo1.jpg" })
                    .expect(201);

                const response = await request(app)
                    .post(`/api/gauges/${gauge._id}/photos`)
                    .send({ filePath: "/uploads/photo2.jpg", caption: "Second photo" })
                    .expect(201);

                expect(response.body.data.photos).toHaveLength(2);
            });
        });
    });

    describe("Validation Failure Cases", () => {
        describe("POST cases", () => {
            it("should fail when project is missing", async () => {
                const gaugeData = {
                    name: "Test Gauge",
                    gaugeType: "blocked",
                    stitches: 20,
                    rows: 28,
                    widthCm: 10,
                    heightCm: 10,
                };

                const response = await request(app).post("/api/gauges").send(gaugeData).expect(400);

                expect(response.body.success).toBe(false);
                expect(response.body.message).toBe("Validation error");
            });

            it("should fail when name is missing", async () => {
                const gaugeData = {
                    project: testProject._id.toString(),
                    gaugeType: "blocked",
                    stitches: 20,
                    rows: 28,
                    widthCm: 10,
                    heightCm: 10,
                };

                const response = await request(app).post("/api/gauges").send(gaugeData).expect(400);

                expect(response.body.success).toBe(false);
            });

            it("should fail when gaugeType is missing", async () => {
                const gaugeData = {
                    project: testProject._id.toString(),
                    name: "Test Gauge",
                    stitches: 20,
                    rows: 28,
                    widthCm: 10,
                    heightCm: 10,
                };

                const response = await request(app).post("/api/gauges").send(gaugeData).expect(400);

                expect(response.body.success).toBe(false);
            });

            it("should fail when gaugeType is invalid", async () => {
                const gaugeData = {
                    project: testProject._id.toString(),
                    name: "Test Gauge",
                    gaugeType: "invalid",
                    stitches: 20,
                    rows: 28,
                    widthCm: 10,
                    heightCm: 10,
                };

                const response = await request(app).post("/api/gauges").send(gaugeData).expect(400);

                expect(response.body.success).toBe(false);
            });

            it("should fail when stitches is missing", async () => {
                const gaugeData = {
                    project: testProject._id.toString(),
                    name: "Test Gauge",
                    gaugeType: "blocked",
                    rows: 28,
                    widthCm: 10,
                    heightCm: 10,
                };

                const response = await request(app).post("/api/gauges").send(gaugeData).expect(400);

                expect(response.body.success).toBe(false);
            });

            it("should fail when rows is missing", async () => {
                const gaugeData = {
                    project: testProject._id.toString(),
                    name: "Test Gauge",
                    gaugeType: "blocked",
                    stitches: 20,
                    widthCm: 10,
                    heightCm: 10,
                };

                const response = await request(app).post("/api/gauges").send(gaugeData).expect(400);

                expect(response.body.success).toBe(false);
            });

            it("should fail when widthCm is missing", async () => {
                const gaugeData = {
                    project: testProject._id.toString(),
                    name: "Test Gauge",
                    gaugeType: "blocked",
                    stitches: 20,
                    rows: 28,
                    heightCm: 10,
                };

                const response = await request(app).post("/api/gauges").send(gaugeData).expect(400);

                expect(response.body.success).toBe(false);
            });

            it("should fail when heightCm is missing", async () => {
                const gaugeData = {
                    project: testProject._id.toString(),
                    name: "Test Gauge",
                    gaugeType: "blocked",
                    stitches: 20,
                    rows: 28,
                    widthCm: 10,
                };

                const response = await request(app).post("/api/gauges").send(gaugeData).expect(400);

                expect(response.body.success).toBe(false);
            });

            it("should fail when name is empty string", async () => {
                const gaugeData = {
                    project: testProject._id.toString(),
                    name: "",
                    gaugeType: "blocked",
                    stitches: 20,
                    rows: 28,
                    widthCm: 10,
                    heightCm: 10,
                };

                const response = await request(app).post("/api/gauges").send(gaugeData).expect(400);

                expect(response.body.success).toBe(false);
            });

            it("should fail when name exceeds 200 characters", async () => {
                const gaugeData = {
                    project: testProject._id.toString(),
                    name: "a".repeat(201),
                    gaugeType: "blocked",
                    stitches: 20,
                    rows: 28,
                    widthCm: 10,
                    heightCm: 10,
                };

                const response = await request(app).post("/api/gauges").send(gaugeData).expect(400);

                expect(response.body.success).toBe(false);
            });

            it("should fail when comments exceed 2000 characters", async () => {
                const gaugeData = {
                    project: testProject._id.toString(),
                    name: "Test Gauge",
                    gaugeType: "blocked",
                    comments: "a".repeat(2001),
                    stitches: 20,
                    rows: 28,
                    widthCm: 10,
                    heightCm: 10,
                };

                const response = await request(app).post("/api/gauges").send(gaugeData).expect(400);

                expect(response.body.success).toBe(false);
            });

            it("should fail when stitches is negative", async () => {
                const gaugeData = {
                    project: testProject._id.toString(),
                    name: "Test Gauge",
                    gaugeType: "blocked",
                    stitches: -10,
                    rows: 28,
                    widthCm: 10,
                    heightCm: 10,
                };

                const response = await request(app).post("/api/gauges").send(gaugeData).expect(400);

                expect(response.body.success).toBe(false);
            });

            it("should fail when rows is negative", async () => {
                const gaugeData = {
                    project: testProject._id.toString(),
                    name: "Test Gauge",
                    gaugeType: "blocked",
                    stitches: 20,
                    rows: -5,
                    widthCm: 10,
                    heightCm: 10,
                };

                const response = await request(app).post("/api/gauges").send(gaugeData).expect(400);

                expect(response.body.success).toBe(false);
            });

            it("should fail when widthCm is negative", async () => {
                const gaugeData = {
                    project: testProject._id.toString(),
                    name: "Test Gauge",
                    gaugeType: "blocked",
                    stitches: 20,
                    rows: 28,
                    widthCm: -10,
                    heightCm: 10,
                };

                const response = await request(app).post("/api/gauges").send(gaugeData).expect(400);

                expect(response.body.success).toBe(false);
            });

            it("should fail when heightCm is negative", async () => {
                const gaugeData = {
                    project: testProject._id.toString(),
                    name: "Test Gauge",
                    gaugeType: "blocked",
                    stitches: 20,
                    rows: 28,
                    widthCm: 10,
                    heightCm: -10,
                };

                const response = await request(app).post("/api/gauges").send(gaugeData).expect(400);

                expect(response.body.success).toBe(false);
            });

            it("should fail when project ID is invalid", async () => {
                const gaugeData = {
                    project: "invalid-id",
                    name: "Test Gauge",
                    gaugeType: "blocked",
                    stitches: 20,
                    rows: 28,
                    widthCm: 10,
                    heightCm: 10,
                };

                const response = await request(app).post("/api/gauges").send(gaugeData).expect(400);

                expect(response.body.success).toBe(false);
            });

            it("should fail when yarn ID is invalid", async () => {
                const gaugeData = {
                    project: testProject._id.toString(),
                    name: "Test Gauge",
                    gaugeType: "blocked",
                    yarn: "invalid-id",
                    stitches: 20,
                    rows: 28,
                    widthCm: 10,
                    heightCm: 10,
                };

                const response = await request(app).post("/api/gauges").send(gaugeData).expect(400);

                expect(response.body.success).toBe(false);
            });
        });

        describe("GET cases", () => {
            it("should return 404 for a non-existent gauge ID", async () => {
                const validNonExistentId = new mongoose.Types.ObjectId();
                const response = await request(app).get(`/api/gauges/${validNonExistentId}`);

                expect(response.status).toBe(404);
                expect(response.body.success).toBe(false);
                expect(response.body.message).toBe("Gauge not found");
            });

            it("should return 400 for an invalid gauge ID", async () => {
                const invalidId = "123-invalid-id";
                const response = await request(app).get(`/api/gauges/${invalidId}`);

                expect(response.status).toBe(400);
                expect(response.body.success).toBe(false);
                expect(response.body.message).toContain(`Invalid _id: ${invalidId}`);
            });
        });

        describe("PUT cases", () => {
            it("should return 400 when update body is empty", async () => {
                const gauge = await Gauge.create({
                    project: testProject._id,
                    name: "Test Gauge",
                    gaugeType: "blocked",
                    stitches: 20,
                    rows: 28,
                    widthCm: 10,
                    heightCm: 10,
                });
                const updateData = {};

                const response = await request(app).put(`/api/gauges/${gauge._id}`).send(updateData);

                expect(response.status).toBe(400);
                expect(response.body.success).toBe(false);
            });

            it("should return 404 when updating a non-existent gauge", async () => {
                const validNonExistentId = new mongoose.Types.ObjectId();
                const updateData = { name: "Updated Name" };

                const response = await request(app).put(`/api/gauges/${validNonExistentId}`).send(updateData);

                expect(response.status).toBe(404);
                expect(response.body.success).toBe(false);
                expect(response.body.message).toBe("Gauge not found");
            });

            it("should return 400 when name exceeds max length in update", async () => {
                const gauge = await Gauge.create({
                    project: testProject._id,
                    name: "Test Gauge",
                    gaugeType: "blocked",
                    stitches: 20,
                    rows: 28,
                    widthCm: 10,
                    heightCm: 10,
                });
                const updateData = { name: "a".repeat(201) };

                const response = await request(app).put(`/api/gauges/${gauge._id}`).send(updateData);

                expect(response.status).toBe(400);
                expect(response.body.success).toBe(false);
            });
        });

        describe("DELETE cases", () => {
            it("should return 404 when deleting a non-existent gauge", async () => {
                const validNonExistentId = new mongoose.Types.ObjectId();

                const response = await request(app).delete(`/api/gauges/${validNonExistentId}`);

                expect(response.status).toBe(404);
                expect(response.body.success).toBe(false);
                expect(response.body.message).toBe("Gauge not found");
            });

            it("should return 400 when deleting with invalid ID", async () => {
                const invalidId = "invalid-id-format";

                const response = await request(app).delete(`/api/gauges/${invalidId}`);

                expect(response.status).toBe(400);
                expect(response.body.success).toBe(false);
            });
        });

        describe("POST /:id/photos cases", () => {
            it("should fail when filePath is missing", async () => {
                const gauge = await Gauge.create({
                    project: testProject._id,
                    name: "Test Gauge",
                    gaugeType: "blocked",
                    stitches: 20,
                    rows: 28,
                    widthCm: 10,
                    heightCm: 10,
                });
                const photoData = {
                    caption: "Test caption",
                };

                const response = await request(app).post(`/api/gauges/${gauge._id}/photos`).send(photoData).expect(400);

                expect(response.body.success).toBe(false);
            });

            it("should fail when filePath is empty", async () => {
                const gauge = await Gauge.create({
                    project: testProject._id,
                    name: "Test Gauge",
                    gaugeType: "blocked",
                    stitches: 20,
                    rows: 28,
                    widthCm: 10,
                    heightCm: 10,
                });
                const photoData = {
                    filePath: "",
                };

                const response = await request(app).post(`/api/gauges/${gauge._id}/photos`).send(photoData).expect(400);

                expect(response.body.success).toBe(false);
            });

            it("should fail when caption exceeds 500 characters", async () => {
                const gauge = await Gauge.create({
                    project: testProject._id,
                    name: "Test Gauge",
                    gaugeType: "blocked",
                    stitches: 20,
                    rows: 28,
                    widthCm: 10,
                    heightCm: 10,
                });
                const photoData = {
                    filePath: "/uploads/photo.jpg",
                    caption: "a".repeat(501),
                };

                const response = await request(app).post(`/api/gauges/${gauge._id}/photos`).send(photoData).expect(400);

                expect(response.body.success).toBe(false);
            });

            it("should return 404 when adding photo to non-existent gauge", async () => {
                const validNonExistentId = new mongoose.Types.ObjectId();
                const photoData = {
                    filePath: "/uploads/photo.jpg",
                };

                const response = await request(app)
                    .post(`/api/gauges/${validNonExistentId}/photos`)
                    .send(photoData)
                    .expect(404);

                expect(response.body.success).toBe(false);
                expect(response.body.message).toBe("Gauge not found");
            });
        });
    });

    describe("Database Persistence", () => {
        it("should persist timestamps correctly", async () => {
            const gaugeData = {
                project: testProject._id.toString(),
                name: "Timestamp Test",
                gaugeType: "blocked",
                stitches: 20,
                rows: 28,
                widthCm: 10,
                heightCm: 10,
            };

            const response = await request(app).post("/api/gauges").send(gaugeData).expect(201);

            expect(response.body.data).toHaveProperty("createdAt");
            expect(response.body.data).not.toHaveProperty("updatedAt");

            const createdAt = new Date(response.body.data.createdAt);
            expect(createdAt).toBeInstanceOf(Date);
        });

        it("should initialize empty array for photos", async () => {
            const gaugeData = {
                project: testProject._id.toString(),
                name: "Array Test",
                gaugeType: "blocked",
                stitches: 20,
                rows: 28,
                widthCm: 10,
                heightCm: 10,
            };

            const response = await request(app).post("/api/gauges").send(gaugeData).expect(201);

            const gaugeInDb = await Gauge.findById(response.body.data._id);

            expect(Array.isArray(gaugeInDb.photos)).toBe(true);
            expect(gaugeInDb.photos.length).toBe(0);
        });

        it("should include virtual fields for calculations", async () => {
            const gaugeData = {
                project: testProject._id.toString(),
                name: "Virtual Fields Test",
                gaugeType: "blocked",
                stitches: 20,
                rows: 28,
                widthCm: 10,
                heightCm: 10,
            };

            const response = await request(app).post("/api/gauges").send(gaugeData).expect(201);

            expect(response.body.data).toHaveProperty("stitchesPerCm");
            expect(response.body.data).toHaveProperty("rowsPerCm");
            expect(response.body.data).toHaveProperty("stitchesPerInch");
            expect(response.body.data).toHaveProperty("rowsPerInch");

            expect(response.body.data.stitchesPerCm).toBe(2);
            expect(response.body.data.rowsPerCm).toBe(2.8);
            expect(response.body.data.stitchesPerInch).toBeCloseTo(5.08, 2);
            expect(response.body.data.rowsPerInch).toBeCloseTo(7.112, 2);
        });
    });

    describe("Edge Cases", () => {
        it("should handle gauge with zero numeric values", async () => {
            const gaugeData = {
                project: testProject._id.toString(),
                name: "Zero Values Gauge",
                gaugeType: "blocked",
                stitches: 0,
                rows: 0,
                widthCm: 10,
                heightCm: 10,
            };

            const response = await request(app).post("/api/gauges").send(gaugeData).expect(201);

            expect(response.body.data.stitches).toBe(0);
            expect(response.body.data.rows).toBe(0);
        });

        it("should handle gauge with very long valid name", async () => {
            const gaugeData = {
                project: testProject._id.toString(),
                name: "a".repeat(200),
                gaugeType: "blocked",
                stitches: 20,
                rows: 28,
                widthCm: 10,
                heightCm: 10,
            };

            const response = await request(app).post("/api/gauges").send(gaugeData).expect(201);

            expect(response.body.data.name).toHaveLength(200);
        });

        it("should handle empty comments field", async () => {
            const gaugeData = {
                project: testProject._id.toString(),
                name: "Gauge with Empty Comments",
                gaugeType: "blocked",
                comments: "",
                stitches: 20,
                rows: 28,
                widthCm: 10,
                heightCm: 10,
            };

            const response = await request(app).post("/api/gauges").send(gaugeData).expect(201);

            expect(response.body.data.comments).toBe("");
        });

        it("should handle special characters in text fields", async () => {
            const gaugeData = {
                project: testProject._id.toString(),
                name: "Gauge with Special Chars: !@#$%^&*()",
                gaugeType: "blocked",
                comments: "Comments with 'quotes' and \"double quotes\"",
                stitches: 20,
                rows: 28,
                widthCm: 10,
                heightCm: 10,
            };

            const response = await request(app).post("/api/gauges").send(gaugeData).expect(201);

            expect(response.body.data.name).toContain("!@#$%^&*()");
            expect(response.body.data.comments).toContain("'quotes'");
        });

        it("should handle multiple query parameters at once", async () => {
            const project2 = await Project.create({ name: "Project 2", projectType: "crochet" });

            await Gauge.create([
                {
                    project: testProject._id,
                    name: "Project 1 Blocked",
                    gaugeType: "blocked",
                    stitches: 20,
                    rows: 28,
                    widthCm: 10,
                    heightCm: 10,
                },
                {
                    project: testProject._id,
                    name: "Project 1 Unblocked",
                    gaugeType: "unblocked",
                    stitches: 22,
                    rows: 30,
                    widthCm: 10,
                    heightCm: 10,
                },
                {
                    project: project2._id,
                    name: "Project 2 Blocked",
                    gaugeType: "blocked",
                    stitches: 18,
                    rows: 24,
                    widthCm: 10,
                    heightCm: 10,
                },
            ]);

            const response = await request(app).get(`/api/gauges?project=${testProject._id}&gaugeType=blocked`);

            expect(response.status).toBe(200);
            expect(response.body.pagination.total).toBe(1);
            expect(response.body.data[0].name).toBe("Project 1 Blocked");
        });
    });

    describe("Model Validation", () => {
        it("should fail when both needle and hook are provided", async () => {
            const gaugeData = {
                project: testProject._id.toString(),
                name: "Invalid Gauge",
                gaugeType: "blocked",
                needle: testNeedle._id.toString(),
                hook: testHook._id.toString(),
                stitches: 20,
                rows: 28,
                widthCm: 10,
                heightCm: 10,
            };

            const response = await request(app).post("/api/gauges").send(gaugeData).expect(400);

            expect(response.body.success).toBe(false);
        });
    });
});
