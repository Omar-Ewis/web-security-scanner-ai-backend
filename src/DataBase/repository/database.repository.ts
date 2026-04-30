import { CreateOptions, FlattenMaps, HydratedDocument, Model, MongooseUpdateQueryOptions, ProjectionType, QueryOptions, RootFilterQuery, UpdateQuery, UpdateWriteOpResult } from "mongoose";
export type Lean<T> = HydratedDocument<FlattenMaps<T>>;
export abstract class DatabaseRepository<TDocument> {
  constructor(protected readonly model:Model<TDocument>){}

  async findOne({filter,projection,options}:
    {
      filter?:RootFilterQuery<TDocument>,
      projection?: ProjectionType<TDocument> | null,
      options?: QueryOptions<TDocument> | null
    }
    ):Promise< Lean<TDocument> | HydratedDocument<TDocument> | null>
    {
      // chain execute 
      let queryObject = this.model
      .findOne(filter)
      .select(projection || "");
      if(options?.lean){
        queryObject.lean(options.lean);
      }
      return await queryObject.exec();
    }
    
  async create({data,options}:
    {
      data:Partial<TDocument>[],
      options?:CreateOptions | undefined
    }):Promise<HydratedDocument<TDocument>[]>
    {
      return await this.model.create(data,options)
    }
  async updateOne({
    filter,
    update,
    options,
  }: {
    filter: RootFilterQuery<TDocument>;
    update: UpdateQuery<TDocument>;
    options?: MongooseUpdateQueryOptions<TDocument> | null;
  }): Promise<UpdateWriteOpResult> 
  {
    return await this.model.updateOne(filter,
      {
        ...update,
        $inc:{__v:1}
      }
    , 
    options);
  }

}
