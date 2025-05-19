import {
  BaseEntity,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('workflows', { schema: 'public' })
export class WorkflowEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: string;

  @Column('varchar', { name: 'workflow_id' })
  workflowId: string;

  @Column('varchar', { name: 'type', nullable: true })
  type: string | null = null;

  @Column('json', { name: 'internal_state', nullable: true })
  internalState: string | null = null;

  @Column('varchar', { name: 'status', nullable: true })
  status: string | null = null;

  @CreateDateColumn({
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP(6)',
    name: 'created_at',
  })
  public createdAt: Date = new Date();

  @UpdateDateColumn({
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP(6)',
    onUpdate: 'CURRENT_TIMESTAMP(6)',
    name: 'updated_at',
  })
  public updatedAt: Date = new Date();

  @DeleteDateColumn({
    type: 'timestamptz',
    default: () => `null`,
    name: 'deleted_at',
  })
  public deletedAt: Date | null = null;
}
