from pydantic import BaseModel, ConfigDict


class CategoryBase(BaseModel):
    name: str
    icon: str = "circle"
    color: str = "#0d9488"


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(BaseModel):
    name: str | None = None
    icon: str | None = None
    color: str | None = None


class CategoryRead(CategoryBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    owner_id: int | None
