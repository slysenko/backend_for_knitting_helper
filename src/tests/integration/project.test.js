import request from "supertest";
import mongoose from "mongoose";
import app from "../../app.js";
import Project from "../../models/project.js";
import Yarn from "../../models/yarn.js";
import Needle from "../../models/needle.js";
import Hook from "../../models/hook.js";

describe("POST /api/projects - Create Project", () => {
    describe("Success Cases", () => {
        describe("POST cases", () => {
            it("should create a project with minimal required fields", async () => {
                const projectData = {
                    name: "My First Sweater",
                    projectType: "knitting",
                };

                const response = await request(app).post("/api/projects").send(projectData).expect(201);

                expect(response.body.success).toBe(true);
                expect(response.body.message).toBe("Project created successfully");
                expect(response.body.data).toHaveProperty("_id");
                expect(response.body.data.name).toBe("My First Sweater");
                expect(response.body.data.projectType).toBe("knitting");
                expect(response.body.data.status).toBe("active");

                const projectInDb = await Project.findById(response.body.data._id);
                expect(projectInDb).not.toBeNull();
                expect(projectInDb.name).toBe("My First Sweater");
            });

            it("should create a project with all optional fields", async () => {
                const projectData = {
                    name: "Summer Cardigan",
                    comments: "Using a beautiful lace pattern",
                    projectType: "knitting",
                    status: "active",
                    startDate: "2024-01-15T00:00:00.000Z",
                    completionDate: "2024-03-20T00:00:00.000Z",
                };

                const response = await request(app).post("/api/projects").send(projectData).expect(201);

                expect(response.body.success).toBe(true);
                expect(response.body.data.name).toBe("Summer Cardigan");
                expect(response.body.data.comments).toBe("Using a beautiful lace pattern");
                expect(response.body.data.status).toBe("active");
                expect(response.body.data.startDate).toBe("2024-01-15T00:00:00.000Z");
                expect(response.body.data.completionDate).toBe("2024-03-20T00:00:00.000Z");
            });

            it("should create a crochet project", async () => {
                const projectData = {
                    name: "Granny Square Blanket",
                    projectType: "crochet",
                };

                const response = await request(app).post("/api/projects").send(projectData).expect(201);

                expect(response.body.data.projectType).toBe("crochet");
            });

            it("should create a project with yarnsUsed", async () => {
                const yarn = new Yarn({
                    brand: "Malabrigo",
                    name: "Rios",
                });
                await yarn.save();

                const projectData = {
                    name: "Cozy Hat",
                    projectType: "knitting",
                    yarnsUsed: [
                        {
                            yarn: yarn._id.toString(),
                            isPrimary: true,
                            quantityUsed: 2,
                            quantityUnit: "skeins",
                            costPerUnit: 12.99,
                        },
                    ],
                };

                const response = await request(app).post("/api/projects").send(projectData).expect(201);

                expect(response.body.data.yarnsUsed).toHaveLength(1);
                expect(response.body.data.yarnsUsed[0].yarn._id).toBe(yarn._id.toString());
                expect(response.body.data.yarnsUsed[0].isPrimary).toBe(true);
                expect(response.body.data.yarnsUsed[0].quantityUsed).toBe(2);
                expect(response.body.data.primaryYarn).toBeDefined();
                expect(response.body.data.primaryYarn.yarn._id).toBe(yarn._id.toString());
            });

            it("should trim whitespace from project name", async () => {
                const projectData = {
                    name: "  Trimmed Name  ",
                    projectType: "knitting",
                };

                const response = await request(app).post("/api/projects").send(projectData).expect(201);

                expect(response.body.data.name).toBe("Trimmed Name");
            });

            it("should create project with different status values", async () => {
                const statuses = ["active", "completed", "frogged", "hibernating"];

                for (const status of statuses) {
                    const projectData = {
                        name: `Project ${status}`,
                        projectType: "knitting",
                        status: status,
                    };

                    const response = await request(app).post("/api/projects").send(projectData).expect(201);

                    expect(response.body.data.status).toBe(status);
                }
            });

            it("should create a project with multiple yarnsUsed", async () => {
                const yarn1 = await Yarn.create({ name: "Yarn 1", brand: "Brand A" });
                const yarn2 = await Yarn.create({ name: "Yarn 2", brand: "Brand B" });

                const projectData = {
                    name: "Multi-Yarn Project",
                    projectType: "knitting",
                    yarnsUsed: [
                        {
                            yarn: yarn1._id.toString(),
                            isPrimary: true,
                            quantityUsed: 2,
                            quantityUnit: "skeins",
                            costPerUnit: 12.99,
                            currency: "USD",
                        },
                        {
                            yarn: yarn2._id.toString(),
                            quantityUsed: 1,
                            quantityUnit: "balls",
                            costPerUnit: 8.5,
                            currency: "EUR",
                        },
                    ],
                };

                const response = await request(app).post("/api/projects").send(projectData).expect(201);

                expect(response.body.success).toBe(true);
                expect(response.body.data.yarnsUsed).toHaveLength(2);
                expect(response.body.data.yarnsUsed[0].yarn.name).toBe("Yarn 1");
                expect(response.body.data.yarnsUsed[0].quantityUsed).toBe(2);
                expect(response.body.data.yarnsUsed[0].isPrimary).toBe(true);
                expect(response.body.data.yarnsUsed[1].yarn.name).toBe("Yarn 2");
                expect(response.body.data.yarnsUsed[1].isPrimary).toBe(false);
            });

            it("should create a project without yarnsUsed (empty array)", async () => {
                const projectData = {
                    name: "No Yarn Project",
                    projectType: "knitting",
                };

                const response = await request(app).post("/api/projects").send(projectData).expect(201);

                expect(response.body.success).toBe(true);
                expect(response.body.data.yarnsUsed).toEqual([]);
            });

            it("should create a project with needlesUsed", async () => {
                const needle = await Needle.create({
                    sizeMm: 4.0,
                    sizeUs: "6",
                    type: "circular",
                    material: "bamboo",
                    brand: "ChiaoGoo",
                });

                const projectData = {
                    name: "Sweater Project",
                    projectType: "knitting",
                    needlesUsed: [
                        {
                            needle: needle._id.toString(),
                            isPrimary: true,
                            notes: "Used for the body",
                        },
                    ],
                };

                const response = await request(app).post("/api/projects").send(projectData).expect(201);

                expect(response.body.success).toBe(true);
                expect(response.body.data.needlesUsed).toHaveLength(1);
                expect(response.body.data.needlesUsed[0].needle._id).toBe(needle._id.toString());
                expect(response.body.data.needlesUsed[0].isPrimary).toBe(true);
                expect(response.body.data.needlesUsed[0].notes).toBe("Used for the body");
            });

            it("should create a project with multiple needlesUsed", async () => {
                const needle1 = await Needle.create({ sizeMm: 4.0, type: "circular" });
                const needle2 = await Needle.create({ sizeMm: 3.5, type: "dpn" });

                const projectData = {
                    name: "Multi-Needle Project",
                    projectType: "knitting",
                    needlesUsed: [
                        {
                            needle: needle1._id.toString(),
                            isPrimary: true,
                            notes: "Main body",
                        },
                        {
                            needle: needle2._id.toString(),
                            isPrimary: false,
                            notes: "Sleeves",
                        },
                    ],
                };

                const response = await request(app).post("/api/projects").send(projectData).expect(201);

                expect(response.body.success).toBe(true);
                expect(response.body.data.needlesUsed).toHaveLength(2);
                expect(response.body.data.needlesUsed[0].isPrimary).toBe(true);
                expect(response.body.data.needlesUsed[1].isPrimary).toBe(false);
            });

            it("should create a project without needlesUsed (empty array)", async () => {
                const projectData = {
                    name: "No Needle Project",
                    projectType: "knitting",
                };

                const response = await request(app).post("/api/projects").send(projectData).expect(201);

                expect(response.body.success).toBe(true);
                expect(response.body.data.needlesUsed).toEqual([]);
            });

            it("should create a project with hooksUsed", async () => {
                const hook = await Hook.create({
                    sizeMm: 5.0,
                    sizeUs: "H/8",
                    material: "aluminum",
                    brand: "Clover",
                });

                const projectData = {
                    name: "Crochet Blanket",
                    projectType: "crochet",
                    hooksUsed: [
                        {
                            hook: hook._id.toString(),
                            isPrimary: true,
                            notes: "Used for entire project",
                        },
                    ],
                };

                const response = await request(app).post("/api/projects").send(projectData).expect(201);

                expect(response.body.success).toBe(true);
                expect(response.body.data.hooksUsed).toHaveLength(1);
                expect(response.body.data.hooksUsed[0].hook._id).toBe(hook._id.toString());
                expect(response.body.data.hooksUsed[0].isPrimary).toBe(true);
                expect(response.body.data.hooksUsed[0].notes).toBe("Used for entire project");
            });

            it("should create a project with multiple hooksUsed", async () => {
                const hook1 = await Hook.create({ sizeMm: 5.0, sizeUs: "H/8" });
                const hook2 = await Hook.create({ sizeMm: 4.0, sizeUs: "G/6" });

                const projectData = {
                    name: "Multi-Hook Project",
                    projectType: "crochet",
                    hooksUsed: [
                        {
                            hook: hook1._id.toString(),
                            isPrimary: true,
                            notes: "Main sections",
                        },
                        {
                            hook: hook2._id.toString(),
                            notes: "Detail work",
                        },
                    ],
                };

                const response = await request(app).post("/api/projects").send(projectData).expect(201);

                expect(response.body.success).toBe(true);
                expect(response.body.data.hooksUsed).toHaveLength(2);
                expect(response.body.data.hooksUsed[0].isPrimary).toBe(true);
                expect(response.body.data.hooksUsed[1].isPrimary).toBe(false);
            });

            it("should create a project without hooksUsed (empty array)", async () => {
                const projectData = {
                    name: "No Hook Project",
                    projectType: "crochet",
                };

                const response = await request(app).post("/api/projects").send(projectData).expect(201);

                expect(response.body.success).toBe(true);
                expect(response.body.data.hooksUsed).toEqual([]);
            });

            it("should create a project with yarns, needles, and hooks", async () => {
                const yarn = await Yarn.create({ name: "Test Yarn", brand: "Test Brand" });
                const needle = await Needle.create({ sizeMm: 4.0, type: "circular" });
                const hook = await Hook.create({ sizeMm: 5.0 });

                const projectData = {
                    name: "Complete Project",
                    projectType: "knitting",
                    yarnsUsed: [
                        {
                            yarn: yarn._id.toString(),
                            quantityUsed: 2,
                            isPrimary: true,
                        },
                    ],
                    needlesUsed: [
                        {
                            needle: needle._id.toString(),
                            isPrimary: true,
                        },
                    ],
                    hooksUsed: [
                        {
                            hook: hook._id.toString(),
                            notes: "Used for edging",
                        },
                    ],
                };

                const response = await request(app).post("/api/projects").send(projectData).expect(201);

                expect(response.body.success).toBe(true);
                expect(response.body.data.yarnsUsed).toHaveLength(1);
                expect(response.body.data.needlesUsed).toHaveLength(1);
                expect(response.body.data.hooksUsed).toHaveLength(1);
            });
        });

        describe("GET cases", () => {
            it("should return an empty array when no projects exist", async () => {
                const response = await request(app).get("/api/projects");

                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
                expect(response.body.data).toEqual([]);
                expect(response.body.pagination).toBeDefined();
                expect(response.body.pagination.total).toBe(0);
            });

            it("should return all projects with default pagination", async () => {
                await Project.create([
                    { name: "Project 1", projectType: "knitting" },
                    { name: "Project 2", projectType: "crochet" },
                ]);

                const response = await request(app).get("/api/projects");

                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
                expect(response.body.data).toHaveLength(2);
                expect(response.body.pagination).toBeDefined();
                expect(response.body.pagination.total).toBe(2);
                expect(response.body.pagination.page).toBe(1);
                expect(response.body.pagination.limit).toBe(20);
                expect(response.body.data.map((p) => p.name)).toContain("Project 1");
                expect(response.body.data.map((p) => p.name)).toContain("Project 2");
            });

            it("should filter projects by projectType", async () => {
                await Project.create([
                    { name: "Knitting Project", projectType: "knitting" },
                    { name: "Crochet Project", projectType: "crochet" },
                ]);

                const response = await request(app).get("/api/projects?projectType=knitting");

                expect(response.status).toBe(200);
                expect(response.body.data).toHaveLength(1);
                expect(response.body.pagination.total).toBe(1);
                expect(response.body.data[0].name).toBe("Knitting Project");
            });

            it("should return a single project by its ID", async () => {
                const project = await Project.create({ name: "Single Project", projectType: "knitting" });

                const response = await request(app).get(`/api/projects/${project._id}`);

                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
                expect(response.body.data._id).toBe(project._id.toString());
                expect(response.body.data.name).toBe("Single Project");
            });

            describe("Pagination", () => {
                beforeEach(async () => {
                    // Create 25 projects for pagination testing
                    const projects = [];
                    for (let i = 1; i <= 25; i++) {
                        projects.push({
                            name: `Project ${i}`,
                            projectType: i % 2 === 0 ? "crochet" : "knitting",
                        });
                    }
                    await Project.create(projects);
                });

                it("should paginate projects with default limit (20)", async () => {
                    const response = await request(app).get("/api/projects?page=1");

                    expect(response.status).toBe(200);
                    expect(response.body.success).toBe(true);
                    expect(response.body.data).toHaveLength(20);
                    expect(response.body.pagination).toEqual({
                        page: 1,
                        limit: 20,
                        total: 25,
                        totalPages: 2,
                        hasNext: true,
                        hasPrev: false,
                    });
                });

                it("should return second page of projects", async () => {
                    const response = await request(app).get("/api/projects?page=2&limit=20");

                    expect(response.status).toBe(200);
                    expect(response.body.data).toHaveLength(5);
                    expect(response.body.pagination).toEqual({
                        page: 2,
                        limit: 20,
                        total: 25,
                        totalPages: 2,
                        hasNext: false,
                        hasPrev: true,
                    });
                });

                it("should paginate with custom limit", async () => {
                    const response = await request(app).get("/api/projects?page=1&limit=10");

                    expect(response.status).toBe(200);
                    expect(response.body.data).toHaveLength(10);
                    expect(response.body.pagination).toEqual({
                        page: 1,
                        limit: 10,
                        total: 25,
                        totalPages: 3,
                        hasNext: true,
                        hasPrev: false,
                    });
                });

                it("should return third page with custom limit", async () => {
                    const response = await request(app).get("/api/projects?page=3&limit=10");

                    expect(response.status).toBe(200);
                    expect(response.body.data).toHaveLength(5);
                    expect(response.body.pagination).toEqual({
                        page: 3,
                        limit: 10,
                        total: 25,
                        totalPages: 3,
                        hasNext: false,
                        hasPrev: true,
                    });
                });

                it("should handle page beyond available data", async () => {
                    const response = await request(app).get("/api/projects?page=10&limit=20");

                    expect(response.status).toBe(200);
                    expect(response.body.data).toHaveLength(0);
                    expect(response.body.pagination.page).toBe(10);
                    expect(response.body.pagination.total).toBe(25);
                });

                it("should combine pagination with filters", async () => {
                    const response = await request(app).get("/api/projects?projectType=knitting&page=1&limit=5");

                    expect(response.status).toBe(200);
                    expect(response.body.data).toHaveLength(5);
                    expect(response.body.pagination.total).toBe(13); // 13 knitting projects out of 25
                    expect(response.body.pagination.totalPages).toBe(3);
                    expect(response.body.data.every((p) => p.projectType === "knitting")).toBe(true);
                });

                it("should handle invalid page number (negative)", async () => {
                    const response = await request(app).get("/api/projects?page=-1");

                    expect(response.status).toBe(200);
                    expect(response.body.pagination.page).toBe(1); // Should default to page 1
                });

                it("should handle invalid page number (zero)", async () => {
                    const response = await request(app).get("/api/projects?page=0");

                    expect(response.status).toBe(200);
                    expect(response.body.pagination.page).toBe(1); // Should default to page 1
                });

                it("should cap limit at maximum (100)", async () => {
                    const response = await request(app).get("/api/projects?limit=200");

                    expect(response.status).toBe(200);
                    expect(response.body.pagination.limit).toBe(100); // Should cap at 100
                });

                it("should handle non-numeric page parameter", async () => {
                    const response = await request(app).get("/api/projects?page=abc");

                    expect(response.status).toBe(200);
                    expect(response.body.pagination.page).toBe(1); // Should default to page 1
                });

                it("should handle non-numeric limit parameter", async () => {
                    const response = await request(app).get("/api/projects?limit=xyz");

                    expect(response.status).toBe(200);
                    expect(response.body.pagination.limit).toBe(20); // Should default to 20
                });

                it("should not interfere with project filters (page and limit should be excluded from query)", async () => {
                    const response = await request(app).get("/api/projects?page=1&limit=10&status=active");

                    expect(response.status).toBe(200);
                    // Should filter by status, not treat page/limit as filter fields
                    expect(response.body.data.every((p) => p.status === "active")).toBe(true);
                });
            });
        });

        describe("PUT cases", () => {
            it("should update a project successfully", async () => {
                const project = await Project.create({ name: "Original Name", projectType: "knitting" });
                const updateData = { name: "Updated Name", status: "completed" };

                const response = await request(app).put(`/api/projects/${project._id}`).send(updateData);

                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
                expect(response.body.data._id).toBe(project._id.toString());
                expect(response.body.data.name).toBe("Updated Name");
                expect(response.body.data.status).toBe("completed");
            });
        });

        describe("DELETE cases", () => {
            it("should delete a project successfully", async () => {
                const project = await Project.create({ name: "To Be Deleted", projectType: "crochet" });

                const response = await request(app).delete(`/api/projects/${project._id}`);

                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
                expect(response.body.message).toBe("Project deleted successfully");

                const dbProject = await Project.findById(project._id);
                expect(dbProject).toBeNull();
            });
        });
    });

    describe("Validation Failure response", () => {
        describe("POST cases", () => {
            it("should fail when name is missing", async () => {
                const projectData = {
                    projectType: "knitting",
                };

                const responseponse = await request(app).post("/api/projects").send(projectData).expect(400);

                expect(responseponse.body.success).toBe(false);
            });

            it("should fail when projectType is missing", async () => {
                const projectData = {
                    name: "My Project",
                };

                const responseponse = await request(app).post("/api/projects").send(projectData).expect(400);

                expect(responseponse.body.success).toBe(false);
            });

            it("should fail when name is empty string", async () => {
                const projectData = {
                    name: "",
                    projectType: "knitting",
                };

                const responseponse = await request(app).post("/api/projects").send(projectData).expect(400);

                expect(responseponse.body.success).toBe(false);
            });

            it("should fail when name exceeds 200 characters", async () => {
                const projectData = {
                    name: "a".repeat(201),
                    projectType: "knitting",
                };

                const responseponse = await request(app).post("/api/projects").send(projectData).expect(400);

                expect(responseponse.body.success).toBe(false);
            });

            it("should fail when projectType is invalid", async () => {
                const projectData = {
                    name: "My Project",
                    projectType: "weaving", // invalid type
                };

                const responseponse = await request(app).post("/api/projects").send(projectData).expect(400);

                expect(responseponse.body.success).toBe(false);
            });

            it("should fail when status is invalid", async () => {
                const projectData = {
                    name: "My Project",
                    projectType: "knitting",
                    status: "paused", // invalid status
                };

                const responseponse = await request(app).post("/api/projects").send(projectData).expect(400);

                expect(responseponse.body.success).toBe(false);
            });

            it("should fail when completionDate is before startDate", async () => {
                const projectData = {
                    name: "Invalid Dates",
                    projectType: "knitting",
                    startDate: "2024-03-20T00:00:00.000Z",
                    completionDate: "2024-01-15T00:00:00.000Z",
                };

                const responseponse = await request(app).post("/api/projects").send(projectData).expect(400);

                expect(responseponse.body.success).toBe(false);
            });

            it("should fail when yarnsUsed contains invalid yarn ID", async () => {
                const projectData = {
                    name: "My Project",
                    projectType: "knitting",
                    yarnsUsed: [
                        {
                            yarn: "invalid-id-format",
                            quantityUsed: 2,
                        },
                    ],
                };

                const response = await request(app).post("/api/projects").send(projectData).expect(400);

                expect(response.body.success).toBe(false);
            });

            it("should fail when yarnsUsed contains duplicate yarn IDs", async () => {
                const yarn = await Yarn.create({ name: "Test Yarn" });

                const projectData = {
                    name: "Duplicate Yarn Project",
                    projectType: "knitting",
                    yarnsUsed: [
                        { yarn: yarn._id.toString(), quantityUsed: 2 },
                        { yarn: yarn._id.toString(), quantityUsed: 3 },
                    ],
                };

                const response = await request(app).post("/api/projects").send(projectData).expect(400);

                expect(response.body.success).toBe(false);
                expect(response.body.message).toContain("Cannot add the same yarn multiple times");
            });

            it("should fail when multiple yarns are marked as primary", async () => {
                const yarn1 = await Yarn.create({ name: "Yarn 1" });
                const yarn2 = await Yarn.create({ name: "Yarn 2" });

                const projectData = {
                    name: "Multiple Primary Yarns Project",
                    projectType: "knitting",
                    yarnsUsed: [
                        { yarn: yarn1._id.toString(), quantityUsed: 2, isPrimary: true },
                        { yarn: yarn2._id.toString(), quantityUsed: 3, isPrimary: true },
                    ],
                };

                const response = await request(app).post("/api/projects").send(projectData).expect(400);

                expect(response.body.success).toBe(false);
                expect(response.body.message).toContain("Only one yarn can be marked as primary");
            });

            it("should fail when comments exceed 2000 characters", async () => {
                const projectData = {
                    name: "My Project",
                    projectType: "knitting",
                    comments: "a".repeat(2001),
                };

                const response = await request(app).post("/api/projects").send(projectData).expect(400);

                expect(response.body.success).toBe(false);
            });

            it("should fail when date format is invalid", async () => {
                const projectData = {
                    name: "My Project",
                    projectType: "knitting",
                    startDate: "not-a-date",
                };

                const response = await request(app).post("/api/projects").send(projectData).expect(400);

                expect(response.body.success).toBe(false);
            });

            it("should fail when needlesUsed contains invalid needle ID", async () => {
                const projectData = {
                    name: "My Project",
                    projectType: "knitting",
                    needlesUsed: [
                        {
                            needle: "invalid-id-format",
                        },
                    ],
                };

                const response = await request(app).post("/api/projects").send(projectData).expect(400);

                expect(response.body.success).toBe(false);
            });

            it("should fail when needlesUsed contains duplicate needle IDs", async () => {
                const needle = await Needle.create({ sizeMm: 4.0, type: "circular" });

                const projectData = {
                    name: "Duplicate Needle Project",
                    projectType: "knitting",
                    needlesUsed: [
                        { needle: needle._id.toString() },
                        { needle: needle._id.toString() },
                    ],
                };

                const response = await request(app).post("/api/projects").send(projectData).expect(400);

                expect(response.body.success).toBe(false);
                expect(response.body.message).toContain("Cannot add the same needle multiple times");
            });

            it("should fail when multiple needles are marked as primary", async () => {
                const needle1 = await Needle.create({ sizeMm: 4.0, type: "circular" });
                const needle2 = await Needle.create({ sizeMm: 3.5, type: "dpn" });

                const projectData = {
                    name: "Multiple Primary Needles Project",
                    projectType: "knitting",
                    needlesUsed: [
                        { needle: needle1._id.toString(), isPrimary: true },
                        { needle: needle2._id.toString(), isPrimary: true },
                    ],
                };

                const response = await request(app).post("/api/projects").send(projectData).expect(400);

                expect(response.body.success).toBe(false);
                expect(response.body.message).toContain("Only one needle can be marked as primary");
            });

            it("should fail when hooksUsed contains invalid hook ID", async () => {
                const projectData = {
                    name: "My Project",
                    projectType: "crochet",
                    hooksUsed: [
                        {
                            hook: "invalid-id-format",
                        },
                    ],
                };

                const response = await request(app).post("/api/projects").send(projectData).expect(400);

                expect(response.body.success).toBe(false);
            });

            it("should fail when hooksUsed contains duplicate hook IDs", async () => {
                const hook = await Hook.create({ sizeMm: 5.0 });

                const projectData = {
                    name: "Duplicate Hook Project",
                    projectType: "crochet",
                    hooksUsed: [
                        { hook: hook._id.toString() },
                        { hook: hook._id.toString() },
                    ],
                };

                const response = await request(app).post("/api/projects").send(projectData).expect(400);

                expect(response.body.success).toBe(false);
                expect(response.body.message).toContain("Cannot add the same hook multiple times");
            });

            it("should fail when multiple hooks are marked as primary", async () => {
                const hook1 = await Hook.create({ sizeMm: 5.0 });
                const hook2 = await Hook.create({ sizeMm: 4.0 });

                const projectData = {
                    name: "Multiple Primary Hooks Project",
                    projectType: "crochet",
                    hooksUsed: [
                        { hook: hook1._id.toString(), isPrimary: true },
                        { hook: hook2._id.toString(), isPrimary: true },
                    ],
                };

                const response = await request(app).post("/api/projects").send(projectData).expect(400);

                expect(response.body.success).toBe(false);
                expect(response.body.message).toContain("Only one hook can be marked as primary");
            });
        });

        describe("GET cases", () => {
            it("should return 400 for missing required fields (e.g., name)", async () => {
                const projectData = {
                    projectType: "crochet",
                };

                const response = await request(app).post("/api/projects").send(projectData);

                expect(response.status).toBe(400);
                expect(response.body.success).toBe(false);
                expect(response.body.message).toBe("Validation error");
                expect(response.body.errors[0].message).toContain('"name" is required');
            });

            it("should return 400 for invalid enum values (e.g., projectType)", async () => {
                const projectData = {
                    name: "Invalid Project",
                    projectType: "sewing",
                };

                const response = await request(app).post("/api/projects").send(projectData);

                expect(response.status).toBe(400);
                expect(response.body.success).toBe(false);
                expect(response.body.errors[0].message).toContain('"projectType" must be one of [knitting, crochet]');
            });

            it("should return 400 for invalid query param", async () => {
                const response = await request(app).get("/api/projects?status=on_fire");

                expect(response.status).toBe(400);
                expect(response.body.success).toBe(false);
                expect(response.body.errors[0].message).toContain('"status" must be one of [active, completed, frogged, hibernating]');
            });

            it("should return 404 for a non-existent project ID", async () => {
                const validNonExistentId = new mongoose.Types.ObjectId();
                const response = await request(app).get(`/api/projects/${validNonExistentId}`);

                expect(response.status).toBe(404);
                expect(response.body.success).toBe(false);
                expect(response.body.message).toBe("Project not found");
            });

            it("should return 400 for an invalid project ID", async () => {
                const invalidId = "123-invalid-id";
                const response = await request(app).get(`/api/projects/${invalidId}`);

                expect(response.status).toBe(400);
                expect(response.body.success).toBe(false);
                expect(response.body.message).toContain(`Invalid _id: ${invalidId}`);
            });
        });

        describe("PUT cases", () => {
            it("should return 400 for invalid update data", async () => {
                const project = await Project.create({ name: "Project", projectType: "knitting" });
                const updateData = { status: "invalid_status" };

                const response = await request(app).put(`/api/projects/${project._id}`).send(updateData);

                expect(response.status).toBe(400);
                expect(response.body.success).toBe(false);
                expect(response.body.errors[0].message).toContain('"status" must be one of [active, completed, frogged, hibernating]');
            });

            it("should return 404 when updating a non-existent project", async () => {
                const validNonExistentId = new mongoose.Types.ObjectId();
                const updateData = { name: "Updated Name" };

                const response = await request(app).put(`/api/projects/${validNonExistentId}`).send(updateData);

                expect(response.status).toBe(404);
                expect(response.body.success).toBe(false);
                expect(response.body.message).toBe("Project not found");
            });
        });

        describe("DELETE cases", () => {
            it("should return 404 when deleting a non-existent project", async () => {
                const validNonExistentId = new mongoose.Types.ObjectId();

                const response = await request(app).delete(`/api/projects/${validNonExistentId}`);

                expect(response.status).toBe(404);
                expect(response.body.success).toBe(false);
                expect(response.body.message).toBe("Project not found");
            });
        });
    });

    describe("Database Persistence", () => {
        it("should persist timestamps correctly", async () => {
            const projectData = {
                name: "Timestamp Test",
                projectType: "knitting",
            };

            const response = await request(app).post("/api/projects").send(projectData).expect(201);

            expect(response.body.data).toHaveProperty("createdAt");
            expect(response.body.data).toHaveProperty("updatedAt");

            const createdAt = new Date(response.body.data.createdAt);
            const updatedAt = new Date(response.body.data.updatedAt);

            expect(createdAt).toBeInstanceOf(Date);
            expect(updatedAt).toBeInstanceOf(Date);
        });

        it("should initialize empty arrays for photos, yarnsUsed, needlesUsed, hooksUsed, and additionalCosts", async () => {
            const projectData = {
                name: "Array Test",
                projectType: "knitting",
            };

            const response = await request(app).post("/api/projects").send(projectData).expect(201);

            const projectInDb = await Project.findById(response.body.data._id);

            expect(Array.isArray(projectInDb.photos)).toBe(true);
            expect(projectInDb.photos.length).toBe(0);
            expect(Array.isArray(projectInDb.yarnsUsed)).toBe(true);
            expect(projectInDb.yarnsUsed.length).toBe(0);
            expect(Array.isArray(projectInDb.needlesUsed)).toBe(true);
            expect(projectInDb.needlesUsed.length).toBe(0);
            expect(Array.isArray(projectInDb.hooksUsed)).toBe(true);
            expect(projectInDb.hooksUsed.length).toBe(0);
            expect(Array.isArray(projectInDb.additionalCosts)).toBe(true);
            expect(projectInDb.additionalCosts.length).toBe(0);
        });
    });
});
