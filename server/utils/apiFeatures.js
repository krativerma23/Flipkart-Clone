export class APIFeatures {
  constructor(query, queryStr) { this.query = query; this.queryStr = queryStr; }

  search() {
    if (this.queryStr.keyword)
      this.query = this.query.find({ $text: { $search: this.queryStr.keyword } });
    return this;
  }

  filter() {
    const q = { ...this.queryStr };
    ['keyword','page','limit','sort'].forEach(f => delete q[f]);
    this.query = this.query.find(JSON.parse(JSON.stringify(q).replace(/\b(gte|gt|lte|lt)\b/g, m => `$${m}`)));
    return this;
  }

  sort() {
    this.query = this.query.sort(this.queryStr.sort ? this.queryStr.sort.replace(',', ' ') : '-createdAt');
    return this;
  }

  paginate(limit = 20) {
    const page = Number(this.queryStr.page) || 1;
    this.query = this.query.skip((page - 1) * limit).limit(limit);
    return this;
  }
}
